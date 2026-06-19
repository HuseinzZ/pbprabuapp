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
    <div className="space-y-6">
      {/* KPI MAIN PANEL COUNTERS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-4 rounded-xl shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider leading-none">TOTAL PESERTA</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-white leading-none mt-1">{total}</p>
            <p className="text-[9px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-0.5 mt-1">
              <CircleDot className="w-2.5 h-2.5" /> Dari Seluruh Turnamen
            </p>
          </div>
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-4 rounded-xl shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider leading-none">TERKONFIRMASI</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-white leading-none mt-1">{confirmed}</p>
            <p className="text-[9px] text-slate-500 dark:text-gray-400 font-medium mt-1">Siap Bertanding</p>
          </div>
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-4 rounded-xl shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider leading-none">MENUNGGU VERIFIKASI</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-white leading-none mt-1">{pending}</p>
            <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold mt-1">Butuh Persetujuan</p>
          </div>
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-4 rounded-xl shadow-sm flex items-center justify-between transition-colors">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider leading-none">MUNDUR / DISKUALIFIKASI</p>
            <p className="text-xl font-extrabold text-slate-800 dark:text-white leading-none mt-1">{inactive}</p>
            <p className="text-[9px] text-slate-500 dark:text-gray-400 font-medium mt-1">Gugur Partisipasi</p>
          </div>
          <div className="w-10 h-10 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400">
            <UserMinus className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
