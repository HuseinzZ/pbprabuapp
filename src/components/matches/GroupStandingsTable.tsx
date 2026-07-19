"use client";

import React from "react";
import type { TeamStanding } from "@/lib/utils/knockout-engine";

interface Props {
  groupName: string;
  standings: TeamStanding[];
  allComplete: boolean;
}


export default function GroupStandingsTable({ groupName, standings, allComplete }: Props) {
  if (standings.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2">
          {/* <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold bg-brand-500">
            {groupName}
          </div> */}
          <span className="font-semibold text-xs text-gray-900 dark:text-white">
            Klasemen Grup {groupName}
          </span>
        </div>
        {allComplete ? (
          <span className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">
            ✓ Selesai
          </span>
        ) : (
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">
            Belum lengkap
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none w-10">NO.</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">TIM</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">MAIN</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">M</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">S</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">K</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">SG</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest select-none">POIN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
            {standings.map((s) => {
              const isQualified = s.position <= 2;
              return (
                <tr
                  key={s.teamId}
                  className={`transition-colors ${
                    isQualified && allComplete
                      ? "bg-green-50/50 dark:bg-green-500/5"
                      : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <td className="px-3 py-2 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="font-bold text-gray-600 dark:text-gray-400">{s.position}</span>
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-medium ${
                      isQualified && allComplete
                        ? "text-green-700 dark:text-green-400"
                        : "text-gray-900 dark:text-white"
                    }`}>
                      {s.teamName.replace(/\s*\/\s*/g, ' & ')}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-xs text-gray-500 dark:text-gray-400">{s.played}</td>
                  <td className="px-3 py-2 text-center text-xs font-semibold text-green-600 dark:text-green-400">{s.wins}</td>
                  <td className="px-3 py-2 text-center text-xs text-yellow-600 dark:text-yellow-400">{s.draws}</td>
                  <td className="px-3 py-2 text-center text-xs text-red-500 dark:text-red-400">{s.losses}</td>
                  <td className="px-3 py-2 text-center text-xs text-gray-500 dark:text-gray-400">
                    {s.scoreDiff > 0 ? "+" : ""}{s.scoreDiff}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                      {s.matchPoints}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {allComplete && (
        <div className="px-4 py-2 border-t border-gray-100 dark:border-white/[0.05] bg-green-50/50 dark:bg-green-500/5">
          <p className="text-[10px] text-green-600 dark:text-green-400">
            ✓ Top 2 lolos ke babak selanjutnya
          </p>
        </div>
      )}
    </div>
  );
}
