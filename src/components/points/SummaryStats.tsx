import React from "react";
import { Point } from "@/app/admin/points/types";
import { Trophy, CheckCircle, XCircle, TrendingUp } from "lucide-react";

interface SummaryStatsProps {
  items: Point[];
}

export default function SummaryStats({ items }: SummaryStatsProps) {
  const total = items.length;
  const activeCount = items.filter((i) => i.is_active).length;
  const inactiveCount = total - activeCount;
  
  const maxPoints = items.length > 0 ? Math.max(...items.map((i) => i.points_winner)) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Types */}
      <div 
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default"
      >
        <div className="p-3 bg-brand-100 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">TOTAL TIPE</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{total}</p>
        </div>
      </div>

      {/* Active Types */}
      <div 
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default"
      >
        <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">AKTIF</p>
          <div className="flex items-baseline gap-1 mt-1.5 leading-none">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{activeCount}</span>
            <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">/{total}</span>
          </div>
        </div>
      </div>

      {/* Inactive Types */}
      <div 
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default"
      >
        <div className="p-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg">
          <XCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">NONAKTIF</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{inactiveCount}</p>
        </div>
      </div>

      {/* Max Points */}
      <div 
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default"
      >
        <div className="p-3 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">POIN TERTINGGI</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{maxPoints.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
