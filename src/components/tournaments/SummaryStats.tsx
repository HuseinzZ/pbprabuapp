import React from "react";
import { Trophy, Medal, CircleDot, CheckCircle2, CalendarClock } from "lucide-react";
import { Tournament } from "@/app/admin/tournaments/types";

interface SummaryStatsProps {
  tournaments: Tournament[];
}

export default function SummaryStats({ tournaments }: SummaryStatsProps) {
  const totalTrn = tournaments.length;
  const activeTrn = tournaments.filter((t) => t.status === "ongoing").length;
  const totalPrizePoints = tournaments.reduce((acc, t) => acc + (t.prize_pool || 0), 0);

  const completedTrn = tournaments.filter((t) => t.status === "completed").length;
  const upcomingTrn = tournaments.filter((t) => t.status === "upcoming").length;

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI 1 */}
      <div 
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default"
      >
        <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">TOTAL TURNAMEN</p>
          <div className="flex items-baseline gap-1 mt-1.5 leading-none">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{totalTrn}</span>
            <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">({activeTrn} aktif)</span>
          </div>
        </div>
      </div>

      {/* KPI 2 */}
      <div 
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default"
      >
        <div className="p-3 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
          <Medal className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none truncate">PRIZE POOL</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none truncate">{formatRupiah(totalPrizePoints)}</p>
        </div>
      </div>

      {/* KPI 3 */}
      <div 
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default"
      >
        <div className="p-3 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">SELESAI</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{completedTrn}</p>
        </div>
      </div>

      {/* KPI 4 */}
      <div 
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default"
      >
        <div className="p-3 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
          <CalendarClock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">MENDATANG</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{upcomingTrn}</p>
        </div>
      </div>
    </div>
  );
}
