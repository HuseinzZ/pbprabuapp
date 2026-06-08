"use client";
import React, { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import { Filter, RefreshCw, Loader2, Swords, ArrowRight, Trophy } from "lucide-react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ExportButtons from "@/components/common/ExportButtons";
import Loader from "@/components/shared/Loader";
import MatchTable, { type Match } from "@/components/matches/MatchTable";
import ScoreInputModal from "@/components/matches/ScoreInputModal";
import DatePicker from "@/components/form/DatePicker";
import { exportCSV, exportPDF } from "@/lib/utils/export";
import PrintReport, { PrintColumn } from "@/components/common/PrintReport";

// ─── Matches Content ───────────────────────────────────────────────────────────
function MatchesContent() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlGroup = searchParams.get("group") || "";
  const urlStatus = searchParams.get("status") || "";
  const urlPhase = searchParams.get("phase") || "";
  // Default to today
  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const urlTournamentDate = searchParams.has("date") ? searchParams.get("date") || "" : defaultDate;
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  
  // URL helpers
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (!v) params.delete(k); else params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);
  // Removed tournaments fetching logic since dropdown is removed
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
        tournaments!inner(name, start_date, tournament_types(name))
      `)
      .order("phase", { ascending: true })
      .order("group_name", { ascending: true })
      .order("match_number", { ascending: true });
    if (urlTournamentDate) {
      const [year, month, day] = urlTournamentDate.split("-");
      if (year && month && day) {
        const startDate = new Date(Number(year), Number(month) - 1, Number(day)).toISOString();
        const endDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999).toISOString();
        query = query.gte("tournaments.start_date", startDate).lte("tournaments.start_date", endDate);
      }
    }
    if (urlGroup) query = query.eq("group_name", urlGroup);
    if (urlStatus) query = query.eq("status", urlStatus);
    if (urlPhase) query = query.eq("phase", urlPhase);
    const { data: matchData, error: matchErr } = await query;
    if (matchErr) { toast.error(matchErr.message); }
    else { setMatches((matchData as unknown as Match[]) ?? []); }
    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, [urlTournamentDate, urlGroup, urlStatus, urlPhase, supabase]);
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

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Jadwal Pertandingan" />
      <div className="flex items-start justify-end gap-3">
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
          onExportPDF={() => exportPDF("print-matches", "Jadwal_Pertandingan.pdf")}
        />
      </div>
      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col lg:flex-row lg:items-center lg:flex-wrap xl:flex-nowrap gap-3">
        {/* Filter Tanggal */}
        <div className="flex shrink-0 w-15 lg:w-40">
          <DatePicker
            value={urlTournamentDate || ""}
            onChange={(val) => updateParams({ date: val, group: null })}
            placeholder="Pilih Tanggal"
          />
        </div>
        {/* Grup */}
        {groups.length > 0 && (
          <div className="flex shrink-0 w-full lg:w-auto">
            <select
              value={urlGroup}
              onChange={e => updateParams({ group: e.target.value })}
              className="w-full lg:w-auto px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition cursor-pointer"
            >
              <option value="">Semua Grup</option>
              {groups.map(g => (
                <option key={g} value={g!}>Grup {g}</option>
              ))}
            </select>
          </div>
        )}
        {/* Status */}
        <div className="flex shrink-0 w-full lg:w-auto">
          <select
            value={urlStatus}
            onChange={e => updateParams({ status: e.target.value })}
            className="w-full lg:w-auto px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition cursor-pointer"
          >
            <option value="">Semua Status</option>
            <option value="scheduled">Dijadwalkan</option>
            <option value="ongoing">Berlangsung</option>
            <option value="completed">Selesai</option>
          </select>
        </div>
        {/* Fase */}
        <div className="flex shrink-0 w-full lg:w-auto">
          <select
            value={urlPhase}
            onChange={e => updateParams({ phase: e.target.value })}
            className="w-full lg:w-auto px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition cursor-pointer"
          >
            <option value="">Semua Fase</option>
            <option value="RR">Grup (RR)</option>
            <option value="QF">Perempat Final</option>
            <option value="SF">Semi Final</option>
            <option value="3RD">Perebutan Juara 3</option>
            <option value="F">Final</option>
          </select>
        </div>
      </div>
      {/* Tabel jadwal */}
      <MatchTable
        loading={loading}
        matches={matches}
        onInputScore={(m) => setSelectedMatch(m)}
      />
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
