import React from "react";
import { Users, CheckCircle2, Clock, Sparkles, Trophy, UserMinus, CircleDot } from "lucide-react";
import { Participant } from "@/app/admin/participant/types";

interface SummaryStatsProps {
  participants: Participant[];
}

export default function SummaryStats({ participants }: SummaryStatsProps) {
  const total = participants.length;
  const confirmed = participants.filter((p) => p.status === "confirmed").length;
  const pending = participants.filter((p) => p.status === "pending").length;
  const inactive = participants.filter((p) => p.status === "withdrawn" || p.status === "disqualified").length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* KPI 1 */}
      <div 
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default"
      >
        <div className="p-3 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">TOTAL PESERTA</p>
          <div className="flex items-baseline gap-1 mt-1.5 leading-none">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{total}</span>
          </div>
        </div>
      </div>

      {/* KPI 2 */}
      <div 
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default"
      >
        <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">TERKONFIRMASI</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{confirmed}</p>
        </div>
      </div>

      {/* KPI 3 */}
      <div 
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default"
      >
        <div className="p-3 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">MENUNGGU VERIFIKASI</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{pending}</p>
        </div>
      </div>

      {/* KPI 4 */}
      <div 
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default"
      >
        <div className="p-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg">
          <UserMinus className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">MUNDUR / DISKUALIFIKASI</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{inactive}</p>
        </div>
      </div>
    </div>
  );
}
