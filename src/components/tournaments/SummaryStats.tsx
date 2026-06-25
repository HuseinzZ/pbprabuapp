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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1 */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-4 rounded-xl shadow-sm flex items-center justify-between transition-colors">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider leading-none">
            TOTAL TURNAMEN
          </p>
          <p className="text-xl font-extrabold text-slate-800 dark:text-white leading-none mt-1">
            {totalTrn}
          </p>
          <p className="text-[9px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-0.5 mt-1">
            <CircleDot className="w-2.5 h-2.5" /> {activeTrn} Berlangsung Aktif
          </p>
        </div>
        <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Trophy className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 2 */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-4 rounded-xl shadow-sm flex items-center justify-between transition-colors">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider leading-none">
            DISTRIBUSI PRIZE POOL
          </p>
          <p className="text-xl font-extrabold text-slate-800 dark:text-white leading-none mt-1">
            {formatRupiah(totalPrizePoints)}
          </p>
          <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-1">
            Total Pool All-Time
          </p>
        </div>
        <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400">
          <Medal className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 3 */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-4 rounded-xl shadow-sm flex items-center justify-between transition-colors">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider leading-none">
            TURNAMEN SELESAI
          </p>
          <p className="text-xl font-extrabold text-slate-800 dark:text-white leading-none mt-1">
            {completedTrn}
          </p>
          <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold mt-1">
            Sudah Selesai
          </p>
        </div>
        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      {/* KPI 4 */}
      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-4 rounded-xl shadow-sm flex items-center justify-between transition-colors">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider leading-none">
            TURNAMEN MENDATANG
          </p>
          <p className="text-xl font-extrabold text-slate-800 dark:text-white leading-none mt-1">
            {upcomingTrn}
          </p>
          <p className="text-[9px] text-purple-600 dark:text-purple-400 font-bold mt-1">
            Akan Diselenggarakan
          </p>
        </div>
        <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
          <CalendarClock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
