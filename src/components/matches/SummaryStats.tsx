import React from "react";
import { Trophy, Flame, Clock, CheckCircle2 } from "lucide-react";

interface SummaryStatsProps {
  stats: {
    total: number;
    ongoing: number;
    scheduled: number;
    completed: number;
  };
}

export default function SummaryStats({ stats }: SummaryStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Matches */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default">
        <div className="p-3 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">TOTAL LAGA</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{stats.total}</p>
        </div>
      </div>

      {/* Live Matches */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default">
        <div className="p-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg animate-pulse">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">BERLANGSUNG</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{stats.ongoing}</p>
        </div>
      </div>

      {/* Scheduled Matches */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default">
        <div className="p-3 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">MENUNGGU</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{stats.scheduled}</p>
        </div>
      </div>

      {/* Completed */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default">
        <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">SELESAI</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{stats.completed}</p>
        </div>
      </div>
    </div>
  );
}
