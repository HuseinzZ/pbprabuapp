"use client";

import React, { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import { Filter, RefreshCw, Loader2, Swords, ArrowRight, Trophy } from "lucide-react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loader from "@/components/shared/Loader";
import MatchTable, { type Match } from "@/components/matches/MatchTable";
import GroupStandingsTable from "@/components/matches/GroupStandingsTable";
import ScoreInputModal from "@/components/matches/ScoreInputModal";
import {
  computeGroupStandings
} from "@/lib/utils/knockout-engine";
import { syncTournamentStatuses } from "@/lib/utils/tournamentStatus";
import DatePicker from "@/components/form/DatePicker";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface TeamRow {
  id: string;
  name: string;
  group_name: string | null;
  is_bye_team: boolean;
}

// ─── Matches Content ───────────────────────────────────────────────────────────

function ScoreInputContent() {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlTournament = searchParams.get("tournament") || "";
  const urlGroup = searchParams.get("group") || "";
  const urlStatus = searchParams.get("status") || "";

  // Default to today
  const today = new Date();
  const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const urlTournamentDate = searchParams.has("date") ? searchParams.get("date") || "" : defaultDate;

  const [tournaments, setTournaments] = useState<{ id: string; name: string }[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [refreshing, setRefreshing] = useState(false);


  // URL helpers
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (!v) params.delete(k); else params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  useEffect(() => {
    async function init() {
      await syncTournamentStatuses();
      let query = supabase.from("tournaments")
        .select("id, name")
        .eq("status", "ongoing")
        .order("start_date", { ascending: false });
        
      if (urlTournamentDate) {
        const [year, month, day] = urlTournamentDate.split("-");
        if (year && month && day) {
          const startDate = new Date(Number(year), Number(month) - 1, Number(day)).toISOString();
          const endDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999).toISOString();
          query = query.gte("start_date", startDate).lte("start_date", endDate);
        }
      }

      const { data } = await query;
        
      const list = data ?? [];
      setTournaments(list);
      
      if (list.length > 0 && !urlTournament) {
        const params = new URLSearchParams(window.location.search);
        if (!params.get("tournament")) {
          params.set("tournament", list[0].id);
          params.delete("group");
          router.replace(`${pathname}?${params.toString()}`);
        }
      }
    }
    init();
  }, [supabase, urlTournament, updateParams, urlTournamentDate]);

  // Fetch matches + teams
  const fetchData = useCallback(async (isRefresh = false) => {
    if (!urlTournament) { setMatches([]); setTeams([]); return; }
    if (isRefresh) setRefreshing(true); else setLoading(true);

    // Fetch matches
    let query = supabase
      .from("matches")
      .select(`
        id, tournament_id, phase, group_name, round_number, match_number,
        status, score_team1, score_team2, winner_team_id, is_bye,
        team1_id, team2_id,
        teams_team1:teams!team1_id(id, name, is_bye_team),
        teams_team2:teams!team2_id(id, name, is_bye_team)
      `)
      .eq("tournament_id", urlTournament)
      .order("phase", { ascending: true })
      .order("group_name", { ascending: true })
      .order("match_number", { ascending: true });

    if (urlGroup) query = query.eq("group_name", urlGroup);
    if (urlStatus) query = query.eq("status", urlStatus);

    const { data: matchData, error: matchErr } = await query;
    if (matchErr) { toast.error(matchErr.message); }
    else { setMatches((matchData as unknown as Match[]) ?? []); }

    // Fetch teams (always unfiltered for standings calculation)
    const { data: teamData } = await supabase
      .from("teams")
      .select("id, name, group_name, is_bye_team")
      .eq("tournament_id", urlTournament);
    setTeams((teamData as TeamRow[]) ?? []);

    if (isRefresh) setRefreshing(false); else setLoading(false);
  }, [urlTournament, urlGroup, urlStatus, supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Computed state ──────────────────────────────────────────────────────

  // All matches (unfiltered by group/status) for standings calculation
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  useEffect(() => {
    if (!urlTournament) { setAllMatches([]); return; }
    supabase
      .from("matches")
      .select("id, phase, group_name, team1_id, team2_id, score_team1, score_team2, winner_team_id, status, is_bye")
      .eq("tournament_id", urlTournament)
      .then(({ data }) => setAllMatches((data as unknown as Match[]) ?? []));
  }, [urlTournament, supabase, matches]); // re-fetch when matches change

  const standings = useMemo(
    () => computeGroupStandings(allMatches as any, teams as any),
    [allMatches, teams]
  );



  const groups = [...new Set(matches.filter(m => m.phase === 'RR' || !m.phase).map(m => m.group_name).filter(Boolean))];



  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Input Skor" />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
        {/* <Filter className="w-4 h-4 text-gray-400 shrink-0" /> */}

        {/* Filter Tanggal */}
        <div className="w-15 sm:w-40">
          <DatePicker
            value={urlTournamentDate || ""}
            onChange={(val) => updateParams({ date: val, tournament: null, group: null })}
            placeholder="Pilih Tanggal"
          />
        </div>

        {/* Turnamen
        <select
          value={urlTournament}
          onChange={e => updateParams({ tournament: e.target.value, group: null })}
          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition cursor-pointer"
        >
          <option value="">— Pilih Turnamen —</option>
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select> */}

        {/* Grup */}
        {groups.length > 0 && (
          <select
            value={urlGroup}
            onChange={e => updateParams({ group: e.target.value })}
            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition cursor-pointer"
          >
            <option value="">Semua Grup</option>
            {groups.map(g => (
              <option key={g} value={g!}>Grup {g}</option>
            ))}
          </select>
        )}

        {/* Status */}
        <select
          value={urlStatus}
          onChange={e => updateParams({ status: e.target.value })}
          className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition cursor-pointer"
        >
          <option value="">Semua Status</option>
          <option value="scheduled">Dijadwalkan</option>
          <option value="ongoing">Berlangsung</option>
          <option value="completed">Selesai</option>
        </select>

        {/* Refresh */}
        {/* <button
          onClick={() => fetchData(true)}
          disabled={refreshing || !urlTournament}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button> */}
      </div>

      {/* No tournament selected */}
      {!urlTournament && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500">
          <Swords className="w-14 h-14 mb-4 opacity-20" />
          <p className="text-sm font-medium">Pilih turnamen untuk melihat jadwal pertandingan</p>
          <p className="text-xs mt-1 text-gray-400 dark:text-gray-600">Jadwal dibuat otomatis dari Spin Wheel</p>
        </div>
      )}





      {/* Tabel jadwal */}
      {urlTournament && (
        <MatchTable
          loading={loading}
          matches={matches}
          onInputScore={(m) => setSelectedMatch(m)}
        />
      )}

      {/* Modal input skor */}
      <ScoreInputModal
        match={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onSaved={() => fetchData(true)}
      />
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ScoreInputPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader /></div>}>
      <ScoreInputContent />
    </Suspense>
  );
}
