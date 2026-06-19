"use client";
import React, { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import { Users, Trophy, CheckCircle2, AlertCircle, History, Medal, Swords, Search, Filter, RefreshCcw } from "lucide-react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ExportButtons from "@/components/common/ExportButtons";
import Button from "@/components/ui/button/Button";
import Loader from "@/components/shared/Loader";
import PointHistoryFilters from "@/components/point-histories/PointHistoryFilters";
import PointHistoryTable, { type PointEntry } from "@/components/point-histories/PointHistoryTable";
import { exportCSV, exportPDF, exportJSON } from "@/lib/utils/export";
import PrintReport, { PrintColumn } from "@/components/common/PrintReport";
import {
  computeFinalPositions,
  getPointsFromPosition,
  buildPointEntries,
  type PointConfig as Point,
  type MatchRow,
  type TeamRow,
  type PlayerRow
} from "@/lib/utils/point-system";
// ─── Types ─────────────────────────────────────────────────────────────────────
interface Tournament {
  id: string;
  name: string;
  start_date?: string;
  created_at?: string;
  points: Point | null;
}
function getTierLabel(position: number): string {
  if (position === 1) return "Juara 1";
  if (position === 2) return "Juara 2";
  if (position === 3) return "Semi Final";
  if (position === 4) return "Perempat Final";
  if (position <= 8) return "Round of 16";
  return "Peserta";
}
// removed
// ─── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({
  label, value, icon, color,
}: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}
// ─── Main Content ──────────────────────────────────────────────────────────────
function PointHistoriesContent() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlTournament = searchParams.get("tournament") || "";
  const urlSearch = searchParams.get("search") || "";
  
  const urlTournamentDate = searchParams.has("date") ? searchParams.get("date") || "" : "";
  const urlSort = searchParams.get("sort") || "points-desc";
  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [entries, setEntries] = useState<PointEntry[]>([]);
  const [loading, setLoading] = useState(false);
  // Update URL params
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (!v) params.delete(k);
        else params.set(k, v);
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );
  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== urlSearch) {
        updateParams({ search: localSearch || null });
      }
    }, 400);
    return () => clearTimeout(t);
  }, [localSearch, urlSearch, updateParams]);
  // Fetch tournament list
  useEffect(() => {
    let query = supabase
      .from("tournaments")
      .select("id, name, start_date, created_at, points(*)")
      .neq("status", "cancelled")
      .order("start_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (urlTournamentDate) {
      const [year, month, day] = urlTournamentDate.split("-");
      if (year && month && day) {
        const startDate = new Date(Number(year), Number(month) - 1, Number(day)).toISOString();
        const endDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999).toISOString();
        query = query.gte("start_date", startDate).lte("start_date", endDate);
      }
    }
    query.then(({ data }) => {
      const list = (data as unknown as Tournament[]) ?? [];
      setTournaments(list);
      if (list.length > 0 && !urlTournament) {
        // Auto-select the first (latest) tournament available
        const params = new URLSearchParams(window.location.search);
        params.set("tournament", list[0].id);
        if (!urlTournamentDate && list[0].start_date) {
          params.set("date", list[0].start_date.split("T")[0]);
        }
        router.replace(`${pathname}?${params.toString()}`);
      }
    });
  }, [supabase, urlTournamentDate, urlTournament, pathname, router]);
  const [syncing, setSyncing] = useState(false);
  
  // Fetch and compute
  const fetchAndCompute = useCallback(async () => {
    if (!urlTournament) { setEntries([]); return; }
    setLoading(true);
    const selectedTournament = tournaments.find((t) => t.id === urlTournament);
    const pointConfig = selectedTournament?.points;
    if (!pointConfig) {
      toast.error("Tipe turnamen tidak memiliki konfigurasi poin.");
      setLoading(false);
      return;
    }
    // Fetch matches
    const { data: matchesData, error: matchErr } = await supabase
      .from("matches")
      .select("id, phase, group_name, team1_id, team2_id, score_team1, score_team2, winner_team_id, status, is_bye")
      .eq("tournament_id", urlTournament);
    if (matchErr) { toast.error(matchErr.message); setLoading(false); return; }
    // Fetch teams
    const { data: teamsData, error: teamErr } = await supabase
      .from("teams")
      .select("id, name, player1_id, player2_id, group_name, is_bye_team")
      .eq("tournament_id", urlTournament);
    if (teamErr) { toast.error(teamErr.message); setLoading(false); return; }
    // Fetch players
    const playerIds = [
      ...new Set([
        ...(teamsData ?? []).map((t: TeamRow) => t.player1_id),
        ...(teamsData ?? []).map((t: TeamRow) => t.player2_id),
      ].filter(Boolean) as string[]),
    ];
    let playerMap: Record<string, PlayerRow> = {};
    if (playerIds.length > 0) {
      const { data: playersData, error: playerErr } = await supabase
        .from("profile")
        .select("id, fullname, username, avatar_url, ranking_points")
        .in("id", playerIds);
      if (playerErr) { toast.error(playerErr.message); setLoading(false); return; }
      playerMap = Object.fromEntries((playersData ?? []).map((p: PlayerRow) => [p.id, p]));
    }
    const computed = buildPointEntries(
      (matchesData ?? []) as MatchRow[],
      (teamsData ?? []) as TeamRow[],
      playerMap,
      pointConfig
    );
    setEntries(computed);
    setLoading(false);
  }, [urlTournament, tournaments, supabase]);
  useEffect(() => { fetchAndCompute(); }, [fetchAndCompute]);
  const handleSyncPoints = async () => {
    if (!urlTournament) return;
    setSyncing(true);
    try {
      const { autoDistributePoints } = await import("@/lib/actions/point");
      // Find the final match to pass as matchId
      const { data: finalMatch } = await supabase
        .from("matches")
        .select("id")
        .eq("tournament_id", urlTournament)
        .eq("phase", "F")
        .limit(1)
        .single();
      
      const matchId = finalMatch?.id || "";
      // Pass force = true so it recalculates and overwrites old point_histories
      const success = await autoDistributePoints(supabase, urlTournament, matchId, true);
      if (!success) {
        toast.info("Sinkronisasi gagal, mungkin turnamen belum selesai.");
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal sinkronisasi");
    } finally {
      setSyncing(false);
    }
  };
  // Filter and Sort
  const filtered = useMemo(() => {
    let result = entries.filter((e) => {
      if (!urlSearch) return true;
      const q = urlSearch.toLowerCase();
      return e.playerName.toLowerCase().includes(q) || (e.partnerName ?? "").toLowerCase().includes(q);
    });

    result.sort((a, b) => {
      if (urlSort === "points-desc") {
        if (b.points !== a.points) return b.points - a.points;
        return a.position - b.position; // jika poin sama, posisi 1 di atas
      }
      if (urlSort === "points-asc") {
        if (a.points !== b.points) return a.points - b.points;
        return b.position - a.position; // jika poin sama, posisi 8 di atas
      }
      if (urlSort === "name-asc") return a.playerName.localeCompare(b.playerName);
      if (urlSort === "name-desc") return b.playerName.localeCompare(a.playerName);
      
      // Default: points-desc with position fallback
      if (b.points !== a.points) return b.points - a.points;
      return a.position - b.position;
    });

    return result;
  }, [entries, urlSearch, urlSort]);
  // Summary
  const totalPlayers = new Set(entries.map((e) => e.playerId)).size;
  const totalPointsDistributed = entries.reduce((sum, e) => sum + e.points, 0);
  const hasFinalCompleted = entries.some((e) => e.tier === "Juara 1");

  const printColumns: PrintColumn[] = [
    { key: "no", label: "No", width: "5%" },
    { key: "player", label: "Pemain", width: "25%" },
    { key: "partner", label: "Partner", width: "25%" },
    { key: "group", label: "Grup", width: "15%", align: "center" },
    { key: "tier", label: "Capaian", width: "15%", align: "center" },
    { key: "points", label: "Poin", width: "15%", align: "center" },
  ];

  const printGroups = [
    {
      name: `Riwayat Poin (${filtered.length} Pemain)`,
      rows: filtered.map((e, i) => ({
        no: i + 1,
        player: e.playerName,
        partner: e.partnerName ?? "-",
        group: e.groupName,
        tier: e.tier ?? "-",
        points: e.points,
      })),
    },
  ];

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Riwayat Poin" />
      <div className="flex items-start justify-end gap-3">
        <ExportButtons
          disabled={loading || !urlTournament}
          onExportCSV={() =>
            exportCSV(
              "riwayat-poin.csv",
              ["No", "Pemain", "Partner", "Grup", "Capaian", "Poin"],
              filtered.map((e, i) => [
                i + 1,
                e.playerName,
                e.partnerName ?? "-",
                e.groupName,
                e.tier ?? "-",
                e.points,
              ])
            )
          }
          onExportJSON={() => 
            exportJSON(
              "riwayat-poin.json",
              filtered.map((e, i) => ({
                no: i + 1,
                pemain: e.playerName,
                partner: e.partnerName ?? "-",
                grup: e.groupName,
                capaian: e.tier ?? "-",
                poin: e.points,
              }))
            )
          }
          onExportPDF={() => exportPDF("print-points", "Riwayat_Poin.pdf")}
        />
      </div>
      <section className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm flex flex-col overflow-hidden">
        {/* Filters */}
        <PointHistoryFilters
          tournaments={tournaments}
          tournamentId={urlTournament}
          onTournamentChange={(val) => updateParams({ tournament: val || null, search: null })}
          search={localSearch}
          onSearchChange={setLocalSearch}
          date={urlTournamentDate}
          onDateChange={(val) => updateParams({ date: val, tournament: null, search: null })}
          sort={urlSort}
          onSortChange={(val) => updateParams({ sort: val !== "points-desc" ? val : null })}
        />
      {/* Summary cards */}
      {/* {urlTournament && !loading && entries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SummaryCard
            label="Total Pengguna"
            value={totalPlayers}
            icon={<Users className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
            color="bg-brand-50 dark:bg-brand-500/10"
          />
          <SummaryCard
            label="Total Poin Terdistribusi"
            value={totalPointsDistributed}
            icon={<Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            color="bg-amber-50 dark:bg-amber-500/10"
          />
          <SummaryCard
            label="Status Turnamen"
            value={hasFinalCompleted ? "Selesai ✅" : "Berlangsung"}
            icon={<CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />}
            color="bg-green-50 dark:bg-green-500/10"
          />
        </div>
      )} */}
      {/* Empty: no tournament selected */}
      {!urlTournament && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500">
          <Swords className="w-14 h-14 mb-4 opacity-20" />
          <p className="text-sm font-medium">Pilih turnamen untuk melihat riwayat poin</p>
          <p className="text-xs mt-1 text-gray-400 dark:text-gray-600">
            Poin dihitung berdasarkan posisi akhir turnamen (RR + Knockout)
          </p>
        </div>
      )}
      {/* Table */}
      {urlTournament && (
        <div className="border-t border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <PointHistoryTable loading={loading} entries={filtered} />
        </div>
      )}
      </section>

      <PrintReport
        title="Riwayat Poin PB Prabu"
        subtitle={urlTournament ? tournaments.find((t) => t.id === urlTournament)?.name : "Semua"}
        columns={printColumns}
        groups={printGroups}
        printId="print-points"
      />
    </div>
  );
}
// ─── Page ──────────────────────────────────────────────────────────────────────
export default function PointHistoriesPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader /></div>}>
      <PointHistoriesContent />
    </Suspense>
  );
}