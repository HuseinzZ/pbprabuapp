"use client";
import React, { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import { Filter, Loader2, Swords, ArrowRight, Trophy, ShieldCheck, Activity, Calendar, Zap, CheckCircle2, Clock, Users, Flame, ShieldAlert, Plus } from "lucide-react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ExportButtons from "@/components/common/ExportButtons";
import Loader from "@/components/shared/Loader";
import DatePicker from "@/components/form/DatePicker";
import MatchFilters from "@/components/matches/MatchFilters";
import SummaryStats from "@/components/matches/SummaryStats";
import MatchTable from "@/components/matches/MatchTable";
import ScoreInputModal from "@/components/matches/ScoreInputModal";
import AddMatchModal from "@/components/matches/AddMatchModal";
import EditMatchModal from "@/components/matches/EditMatchModal";
import DeleteMatchModal from "@/components/matches/DeleteMatchModal";
import PrintReport, { PrintColumn } from "@/components/common/PrintReport";
import { exportCSV, exportPDF, exportJSON } from "@/lib/utils/export";
import ActivityLogs from "@/components/users/ActivityLogs";
import { type Match } from "@/components/matches/MatchTable";

// ─── Matches Content ───────────────────────────────────────────────────────────
function MatchesContent() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlGroup = searchParams.get("group") || "";
  const urlStatus = searchParams.get("status") || "";
  const urlPhase = searchParams.get("phase") || "";
  const urlTournamentDate = searchParams.has("date") ? searchParams.get("date") || "" : "";
  const urlTournament = searchParams.get("tournament") || "";
  const [matches, setMatches] = useState<Match[]>([]);
  const [tournaments, setTournaments] = useState<{ id: string, name: string, start_date?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [isDeletingMatch, setIsDeletingMatch] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const storedLogs = localStorage.getItem('match_points_logs');
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch (err) {
        setLogs([]);
      }
    }
  }, []);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('match_points_logs');
    toast.success("Log aktivitas sesi berhasil dibersihkan!");
  }, []);

  // URL helpers
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (!v) params.delete(k); else params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  const handleDeleteClick = (id: string) => {
    const match = matches.find(m => m.id === id);
    if (match) setMatchToDelete(match);
  };

  const confirmDeleteMatch = async () => {
    if (!matchToDelete) return;
    setIsDeletingMatch(true);
    const { error } = await supabase.from('matches').delete().eq('id', matchToDelete.id);
    setIsDeletingMatch(false);
    if (error) toast.error("Gagal menghapus: " + error.message);
    else {
      toast.success("Jadwal berhasil dihapus");
      setMatchToDelete(null);
      fetchData(true);
    }
  };

  // Fetch tournaments for dropdown
  useEffect(() => {
    const fetchTournaments = async () => {
      const { data } = await supabase
        .from("tournaments")
        .select("id, name, start_date, created_at")
        .order("start_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (data) {
        setTournaments(data);

        // Auto-select on initial load if no search params are present
        if (data.length > 0 && Array.from(searchParams.keys()).length === 0) {
          const params = new URLSearchParams(window.location.search);
          params.set("tournament", data[0].id);
          if (data[0].start_date) {
            params.set("date", data[0].start_date.split("T")[0]);
          }
          router.replace(`${pathname}?${params.toString()}`);
        }
      }
    };
    fetchTournaments();
  }, [supabase, searchParams, pathname, router]);

  // Fetch matches + teams
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    // Fetch matches
    let query = supabase
      .from("matches")
      .select(`
        id, tournament_id, phase, group_name, round_number, match_number,
        status, score_team1, score_team2, winner_team_id, is_bye,
        team1_id, team2_id,
        teams_team1:teams!team1_id(id, name, is_bye_team),
        teams_team2:teams!team2_id(id, name, is_bye_team),
        tournaments!inner(name, start_date, match_format, gender_category, points(name))
      `)
      // We'll rely on client-side sorting for logical phase order
      // .order("phase", { ascending: true })
      // .order("group_name", { ascending: true })
      // .order("match_number", { ascending: true });
    if (urlTournamentDate) {
      const [year, month, day] = urlTournamentDate.split("-");
      if (year && month && day) {
        const startDate = new Date(Number(year), Number(month) - 1, Number(day)).toISOString();
        const endDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999).toISOString();
        query = query.gte("tournaments.start_date", startDate).lte("tournaments.start_date", endDate);
      }
    }
    if (urlTournament) query = query.eq("tournament_id", urlTournament);
    if (urlGroup) query = query.eq("group_name", urlGroup);
    if (urlStatus) query = query.eq("status", urlStatus);
    if (urlPhase) query = query.eq("phase", urlPhase);
    const { data: matchData, error: matchErr } = await query;
    if (matchErr) { toast.error(matchErr.message); }
    else { 
      const fetchedMatches = (matchData as unknown as Match[]) ?? [];
      
      const phaseWeights: Record<string, number> = {
        'RR': 1,
        'R16': 2,
        'QF': 3,
        'SF': 4,
        '3RD': 5,
        'F': 6,
      };

      fetchedMatches.sort((a, b) => {
        const phaseA = (a.phase || '').toUpperCase();
        const phaseB = (b.phase || '').toUpperCase();
        const wA = phaseWeights[phaseA] || 99;
        const wB = phaseWeights[phaseB] || 99;
        
        if (wA !== wB) return wA - wB;
        
        const gA = a.group_name || '';
        const gB = b.group_name || '';
        if (gA !== gB) return gA.localeCompare(gB);
        
        const mA = a.match_number || 0;
        const mB = b.match_number || 0;
        return mA - mB;
      });

      setMatches(fetchedMatches); 
    }
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, [urlTournamentDate, urlGroup, urlStatus, urlPhase, urlTournament, supabase]);
  useEffect(() => { fetchData(); }, [fetchData]);
  const groups = [...new Set(matches.filter(m => m.phase === 'RR' || !m.phase).map(m => m.group_name).filter(Boolean))];

  const printColumns: PrintColumn[] = [
    { key: "no", label: "No", width: "5%" },
    { key: "tournament", label: "Turnamen", width: "20%" },
    { key: "phase", label: "Fase", width: "10%", align: "center" },
    { key: "group", label: "Grup", width: "10%", align: "center" },
    { key: "team1", label: "Tim 1", width: "20%", align: "right" },
    { key: "score", label: "Skor", width: "10%", align: "center" },
    { key: "team2", label: "Tim 2", width: "20%" },
    { key: "status", label: "Status", width: "5%", align: "center" },
  ];

  const printGroups = [
    {
      name: `Jadwal Pertandingan (${matches.length} Match)`,
      rows: matches.map((m, i) => ({
        no: i + 1,
        tournament: m.tournaments?.name ?? "-",
        phase: m.phase ?? "-",
        group: m.group_name ?? "-",
        team1: m.teams_team1?.name ?? "-",
        score: m.status === "completed" ? `${m.score_team1} - ${m.score_team2}` : "vs",
        team2: m.teams_team2?.name ?? "-",
        status: m.status === "completed" ? "Selesai" : m.status === "ongoing" ? "Mulai" : "Jadwal",
      })),
    },
  ];

  const stats = useMemo(() => {
    return {
      total: matches.length,
      completed: matches.filter(m => m.status === 'completed').length,
      ongoing: matches.filter(m => m.status === 'ongoing').length,
      scheduled: matches.filter(m => m.status === 'scheduled').length,
    };
  }, [matches]);

  const filteredMatches = useMemo(() => {
    let list = [...matches];

    const q = localSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(m =>
        (m.teams_team1?.name ?? "").toLowerCase().includes(q) ||
        (m.teams_team2?.name ?? "").toLowerCase().includes(q) ||
        (m.tournaments?.name ?? "").toLowerCase().includes(q)
      );
    }

    return list;
  }, [matches, localSearch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb pageTitle="Jadwal Pertandingan" />
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" />
            Tambah Jadwal
          </button>
          <ExportButtons
            disabled={loading}
            onExportCSV={() =>
              exportCSV(
                "jadwal.csv",
                ["No", "Turnamen", "Fase", "Grup", "Tim 1", "Skor", "Tim 2", "Status"],
                matches.map((m, i) => [
                  i + 1,
                  m.tournaments?.name ?? "-",
                  m.phase,
                  m.group_name ?? "-",
                  m.teams_team1?.name ?? "-",
                  m.status === "completed" ? `${m.score_team1} - ${m.score_team2}` : "vs",
                  m.teams_team2?.name ?? "-",
                  m.status ?? "-",
                ])
              )
            }
            onExportJSON={() => exportJSON("jadwal.json", matches)}
            onExportPDF={() => exportPDF("print-matches", "Jadwal_Pertandingan.pdf")}
          />
        </div>
      </div>

      {/* Aggregate Bento Metrics */}
      <SummaryStats stats={stats} />

      {/* Dashboard Grid System */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* Main List Section (Wide Column) */}
        <section className="lg:col-span-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm flex flex-col">
          {/* Filters */}
          <MatchFilters
            search={localSearch}
            setSearch={setLocalSearch}
            status={urlStatus}
            setStatus={(val) => updateParams({ status: val })}
            phase={urlPhase}
            setPhase={(val) => updateParams({ phase: val })}
            group={urlGroup}
            setGroup={(val) => updateParams({ group: val })}
            groups={groups as string[]}
            tournamentDate={urlTournamentDate}
            setTournamentDate={(val) => updateParams({ date: val })}
            tournamentId={urlTournament}
            setTournamentId={(val) => updateParams({ tournament: val })}
            tournaments={tournaments.filter(t => !urlTournamentDate || (t.start_date && t.start_date.startsWith(urlTournamentDate)))}
          />

          {/* We wrap Table to blend perfectly with section just like points page */}
          <div className="[&>div]:border-0 [&>div]:shadow-none [&>div]:rounded-none">
            <MatchTable
              loading={loading}
              matches={filteredMatches}
              onInputScore={(m) => setSelectedMatch(m)}
              onEditMatch={(m) => setEditingMatch(m)}
              onDeleteMatch={handleDeleteClick}
            />
          </div>
        </section>

        {/* Quick Info (Slim Column) */}
        <section className="space-y-6 lg:sticky lg:top-6">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm space-y-4">
            <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-brand-500" />
              Verifikasi & Pencegahan
            </h4>
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
              Seluruh transaksi penyuntingan skor, penggantian tim, dan manipulasi poin telah diamankan menggunakan sistem <strong className="text-slate-800 dark:text-white">Strip Tag HTML (XSS Protection)</strong>.
            </p>
          </div>

          <ActivityLogs logs={logs} onClear={handleClearLogs} />
        </section>
      </div>
      {/* Modal input skor */}
      <ScoreInputModal
        match={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onSaved={() => fetchData(true)}
      />

      <PrintReport
        title="Jadwal Pertandingan PB Prabu"
        subtitle={urlTournamentDate ? `Tanggal: ${urlTournamentDate}` : "Semua Jadwal"}
        columns={printColumns}
        groups={printGroups}
        printId="print-matches"
      />

      <AddMatchModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={() => {
          setIsAddModalOpen(false);
          setRefreshing(true);
          fetchData(true);
        }}
      />

      <EditMatchModal
        isOpen={!!editingMatch}
        onClose={() => setEditingMatch(null)}
        match={editingMatch}
        onSaved={() => fetchData(true)}
      />

      <DeleteMatchModal
        isOpen={!!matchToDelete}
        onClose={() => setMatchToDelete(null)}
        onConfirm={confirmDeleteMatch}
        isDeleting={isDeletingMatch}
        matchInfo={matchToDelete ? `${matchToDelete.teams_team1?.name || "Tim 1"} vs ${matchToDelete.teams_team2?.name || "Tim 2"}` : undefined}
      />
    </div>
  );
}
// ─── Page ──────────────────────────────────────────────────────────────────────
export default function MatchesPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader /></div>}>
      <MatchesContent />
    </Suspense>
  );
}
