"use client";

import React from "react";
import { AlertCircle, Medal, History } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface PointEntry {
  playerId: string;
  playerName: string;
  partnerName: string | null;
  groupName: string;
  wins: number;
  draws: number;
  losses: number;
  scoreDiff: number;
  position: number;
  tier: string;
  points: number;
  groupComplete: boolean;
}

interface Props {
  loading: boolean;
  entries: PointEntry[];
}

// ─── Tier config ───────────────────────────────────────────────────────────────

const TIER_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  "Juara 1":        { bg: "bg-amber-50 dark:bg-amber-900",  text: "text-amber-700 dark:text-amber-400",  border: "border-amber-200 dark:border-amber-700" },
  "Juara 2":        { bg: "bg-gray-100 dark:bg-gray-700",   text: "text-gray-600 dark:text-gray-300",    border: "border-gray-200 dark:border-gray-600" },
  "Semi Final":     { bg: "bg-orange-50 dark:bg-orange-900", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-700" },
  "Perempat Final": { bg: "bg-sky-50 dark:bg-sky-900",      text: "text-sky-700 dark:text-sky-400",      border: "border-sky-200 dark:border-sky-700" },
  "Round of 16":    { bg: "bg-purple-50 dark:bg-purple-900", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200 dark:border-purple-700" },
};

const POSITION_ICON: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

// ─── Skeleton Row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-white/[0.05]">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function PointHistoryTable({ loading, entries }: Props) {
  if (!loading && entries.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
          <History className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">Belum ada riwayat poin</p>
          <p className="text-xs mt-1 text-gray-400 dark:text-gray-600">
            Pastikan semua pertandingan dalam grup sudah selesai
          </p>
        </div>
      </div>
    );
  }

  // Group by group name
  const groupedByGroup = entries.reduce<Record<string, PointEntry[]>>((acc, e) => {
    const key = e.groupName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {loading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <table className="w-full">
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : (
        Object.entries(groupedByGroup)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([groupName, groupEntries]) => {
            const groupComplete = groupEntries[0]?.groupComplete ?? false;
            // Sort entries by position within group (deduplicate by position)
            const sortedEntries = [...groupEntries].sort((a, b) => a.position - b.position);

            return (
              <div
                key={groupName}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
              >
                {/* Group Header */}
                <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-brand-500">
                      {groupName}
                    </div>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      Grup {groupName}
                    </span>
                  </div>
                  {!groupComplete && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Pertandingan belum selesai semua
                    </span>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800">
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Posisi</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Pemain</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Partner</th>
                        <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Hasil (M/S/K)</th>
                        <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Pencapaian</th>
                        <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Poin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {sortedEntries.map((entry, idx) => {
                        const tierCfg = TIER_CONFIG[entry.tier] ?? TIER_CONFIG["Perempat Final"];
                        const posIcon = POSITION_ICON[entry.position] ?? "";

                        return (
                          <tr
                            key={`${entry.playerId}-${idx}`}
                            className="transition-colors"
                          >
                            {/* Position */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{posIcon}</span>
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                  #{entry.position}
                                </span>
                              </div>
                            </td>

                            {/* Player */}
                            <td className="px-5 py-4">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {entry.playerName}
                              </p>
                            </td>

                            {/* Partner */}
                            <td className="px-5 py-4">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {entry.partnerName ?? <span className="italic text-gray-300 dark:text-gray-600">—</span>}
                              </p>
                            </td>

                            {/* W/D/L */}
                            <td className="px-5 py-4 text-center">
                              <div className="inline-flex items-center gap-1 text-xs font-mono">
                                <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 font-semibold">
                                  {entry.wins}M
                                </span>
                                {entry.draws > 0 && (
                                  <span className="px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 font-semibold">
                                    {entry.draws}S
                                  </span>
                                )}
                                <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 font-semibold">
                                  {entry.losses}K
                                </span>
                              </div>
                            </td>

                            {/* Tier Badge */}
                            <td className="px-5 py-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${tierCfg.bg} ${tierCfg.text} ${tierCfg.border}`}
                              >
                                <Medal className="w-3 h-3" />
                                {entry.tier}
                              </span>
                            </td>

                            {/* Points */}
                            <td className="px-5 py-4 text-center">
                              <div className="inline-flex flex-col items-center">
                                <span
                                  className={`text-xl font-bold tabular-nums ${
                                    entry.points > 0
                                      ? "text-brand-600 dark:text-brand-400"
                                      : "text-gray-400 dark:text-gray-600"
                                  }`}
                                >
                                  {entry.points}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-600 -mt-0.5">poin</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
      )}
    </div>
  );
}
