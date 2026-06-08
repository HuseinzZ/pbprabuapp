"use client";

import React from "react";
import { Edit2, CheckCircle2, Clock, AlertCircle, Zap, Shield } from "lucide-react";

interface Team {
  id: string;
  name: string;
  is_bye_team: boolean;
}

export interface Match {
  id: string;
  tournament_id: string;
  phase: string;
  group_name: string | null;
  round_number: number | null;
  match_number: number | null;
  status: string | null;
  score_team1: number | null;
  score_team2: number | null;
  winner_team_id: string | null;
  is_bye: boolean | null;
  team1_id: string | null;
  team2_id: string | null;
  teams_team1?: Team | null;
  teams_team2?: Team | null;
  tournaments?: {
    name: string;
    start_date: string;
    tournament_types?: { name: string } | null;
  } | null;
}

interface MatchTableProps {
  loading: boolean;
  matches: Match[];
  onInputScore?: (match: Match) => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  scheduled: {
    label: "Dijadwalkan",
    icon: <Clock className="w-3 h-3" />,
    bg: "bg-sky-100 dark:bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-400",
  },
  ongoing: {
    label: "Berlangsung",
    icon: <Zap className="w-3 h-3" />,
    bg: "bg-amber-100 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
  },
  completed: {
    label: "Selesai",
    icon: <CheckCircle2 className="w-3 h-3" />,
    bg: "bg-green-100 dark:bg-green-500/10",
    text: "text-green-700 dark:text-green-400",
  },
};

const PHASE_CONFIG: Record<string, { label: string; shortLabel: string; bg: string; text: string }> = {
  RR:  { label: "Round Robin",   shortLabel: "RR",  bg: "bg-brand-50 dark:bg-brand-500/10",  text: "text-brand-700 dark:text-brand-400" },
  SF:  { label: "Semi Final",    shortLabel: "SF",  bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-700 dark:text-purple-400" },
  F:   { label: "Final",         shortLabel: "F",   bg: "bg-amber-50 dark:bg-amber-500/10",   text: "text-amber-700 dark:text-amber-400" },
  "3RD": { label: "Perebutan Juara 3", shortLabel: "3rd", bg: "bg-orange-50 dark:bg-orange-500/10", text: "text-orange-700 dark:text-orange-400" },
};

function StatusBadge({ status }: { status: string | null }) {
  const cfg = STATUS_CONFIG[status ?? "scheduled"] ?? STATUS_CONFIG["scheduled"];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  const cfg = PHASE_CONFIG[phase] ?? PHASE_CONFIG["RR"];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
      <Shield className="w-2.5 h-2.5" />
      {cfg.shortLabel}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-white/[0.05]">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-5 py-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ─── Match Rows Component ──────────────────────────────────────────────────────

function MatchRows({ matches, onInputScore }: { matches: Match[]; onInputScore?: (m: Match) => void }) {
  return (
    <>
      {matches.map((match, idx) => {
        const t1 = match.teams_team1;
        const t2 = match.teams_team2;
        const isCompleted = match.status === "completed";
        const t1Wins = isCompleted && match.winner_team_id === match.team1_id;
        const t2Wins = isCompleted && match.winner_team_id === match.team2_id;

        return (
          <tr key={match.id} className="transition-colors">
            {/* Match # */}
            <td className="px-5 py-3 text-sm font-mono text-gray-500 dark:text-gray-400">
              M{idx + 1}
            </td>

            {/* Team 1 */}
            <td className="px-5 py-3">
              <span className={`text-sm font-medium ${t1Wins ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"}`}>
                {t1Wins}{t1?.name ?? "—"}
              </span>
            </td>

            {/* Score */}
            <td className="px-5 py-3 text-center">
              {isCompleted ? (
                <span className="font-bold text-base text-gray-900 dark:text-white">
                  {match.score_team1} – {match.score_team2}
                </span>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-600">vs</span>
              )}
            </td>

            {/* Team 2 */}
            <td className="px-5 py-3 text-right">
              <span className={`text-sm font-medium ${t2Wins ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"}`}>
                {t2?.name ?? "—"}{t2Wins}
              </span>
            </td>

            {/* Status */}
            <td className="px-5 py-3 text-center">
              <StatusBadge status={match.status} />
            </td>

            {/* Action */}
            {onInputScore && (
              <td className="px-5 py-3 text-center">
                <button
                  onClick={() => onInputScore(match)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                  title="Input / Edit Skor"
                >
                  <Edit2 className="w-3 h-3" />
                  {isCompleted ? "Edit" : "Skor"}
                </button>
              </td>
            )}
          </tr>
        );
      })}
    </>
  );
}

// ─── Table Header ──────────────────────────────────────────────────────────────

function TableHead({ showAction }: { showAction?: boolean }) {
  return (
    <thead>
      <tr className="border-b border-gray-100 dark:border-white/[0.05]">
        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Match</th>
        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Tim 1</th>
        <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Skor</th>
        <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Tim 2</th>
        <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
        {showAction && <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Aksi</th>}
      </tr>
    </thead>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MatchTable({ loading, matches, onInputScore }: MatchTableProps) {
  if (!loading && matches.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
          <AlertCircle className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">Belum ada jadwal pertandingan</p>
          <p className="text-xs mt-1 text-gray-400 dark:text-gray-600">Selesaikan Spin Wheel lalu klik Generate Jadwal</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <table className="w-full">
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  // Separate matches by phase
  const rrMatches = matches.filter((m) => m.phase === "RR" || !m.phase);
  const sfMatches = matches.filter((m) => m.phase === "SF");
  const finalMatches = matches.filter((m) => m.phase === "F");
  const thirdPlaceMatches = matches.filter((m) => m.phase === "3RD");

  // Grouping helper by tournament
  const groupMatchesByTournament = (phaseMatches: Match[]) => {
    const grouped: Record<string, Match[]> = {};
    phaseMatches.forEach(m => {
      const key = m.tournament_id || "unknown";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    });
    return grouped;
  };

  // Group RR by tournament and group_name
  const rrGrouped: Record<string, Match[]> = {};
  rrMatches.forEach((m) => {
    const key = `${m.tournament_id}|${m.group_name ?? "—"}`;
    if (!rrGrouped[key]) rrGrouped[key] = [];
    rrGrouped[key].push(m);
  });

  const sfGrouped = groupMatchesByTournament(sfMatches);
  const finalGrouped = groupMatchesByTournament(finalMatches);
  const thirdGrouped = groupMatchesByTournament(thirdPlaceMatches);

  return (
    <div className="space-y-6">
      {/* ── Round Robin Groups ────────────────────────────────────────── */}
      {Object.entries(rrGrouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, groupMatches]) => {
          const completed = groupMatches.filter((m) => m.status === "completed").length;
          const groupName = groupMatches[0]?.group_name || "—";
          const tName = groupMatches[0]?.tournaments?.name || "";
          
          return (
            <div
              key={key}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]"
            >
              {/* Group Header */}
              <div className="match-group-header px-5 py-3 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-brand-500">
                    {groupName}
                  </div>
                  <span className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    Grup {groupName}
                  </span>
                  <PhaseBadge phase="RR" />
                </div>
                <div className="flex items-center gap-3 text-right">
                  {tName && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-[150px] md:max-w-[200px]">{tName}</span>}
                  <span className="text-xs text-gray-500 dark:text-gray-400 border-l border-gray-300 dark:border-gray-600 pl-3">
                    {completed}/{groupMatches.length} selesai
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <TableHead showAction={!!onInputScore} />
                  <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    <MatchRows matches={groupMatches} onInputScore={onInputScore} />
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

      {/* ── Semi Finals ───────────────────────────────────────────────── */}
      {Object.values(sfGrouped).map(tMatches => {
        const completed = tMatches.filter((m) => m.status === "completed").length;
        const tName = tMatches[0]?.tournaments?.name || "";
        const tId = tMatches[0]?.tournament_id || "";
        return (
          <div key={`SF-${tId}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="match-group-header px-5 py-3 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-purple-500">
                  SF
                </div>
                <span className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  Semi Final
                </span>
                <PhaseBadge phase="SF" />
              </div>
              <div className="flex items-center gap-3 text-right">
                {tName && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-[150px] md:max-w-[200px]">{tName}</span>}
                <span className="text-xs text-gray-500 dark:text-gray-400 border-l border-gray-300 dark:border-gray-600 pl-3">
                  {completed}/{tMatches.length} selesai
                </span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <TableHead showAction={!!onInputScore} />
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  <MatchRows matches={tMatches} onInputScore={onInputScore} />
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* ── 3rd Place ─────────────────────────────────────────────────── */}
      {Object.values(thirdGrouped).map(tMatches => {
        const tName = tMatches[0]?.tournaments?.name || "";
        return (
          <div key={`3RD-${tMatches[0]?.tournament_id}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="match-group-header px-5 py-3 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-orange-500">
                  3
                </div>
                <span className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  Perebutan Juara 3
                </span>
                <PhaseBadge phase="3RD" />
              </div>
              <div className="flex items-center gap-3 text-right">
                {tName && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-[150px] md:max-w-[200px]">{tName}</span>}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <TableHead showAction={!!onInputScore} />
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  <MatchRows matches={tMatches} onInputScore={onInputScore} />
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* ── Final ─────────────────────────────────────────────────────── */}
      {Object.values(finalGrouped).map(tMatches => {
        const tName = tMatches[0]?.tournaments?.name || "";
        const tId = tMatches[0]?.tournament_id || "";
        return (
          <div key={`F-${tId}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="match-group-header px-5 py-3 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-amber-500 to-yellow-500">
                  🏆
                </div> */}
                <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  Grand Final
                </span>
                <PhaseBadge phase="F" />
              </div>
              <div className="flex items-center gap-3 text-right">
                {tName && <span className="text-xs text-amber-700/80 dark:text-amber-400/80 font-medium truncate max-w-[150px] md:max-w-[200px]">{tName}</span>}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <TableHead showAction={!!onInputScore} />
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  <MatchRows matches={tMatches} onInputScore={onInputScore} />
                </tbody>
              </table>
            </div>
          </div>
        )
      })}
    </div>
  );
}
