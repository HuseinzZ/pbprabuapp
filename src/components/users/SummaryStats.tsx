import React from "react";
import { User } from "@/app/admin/users/types";
import { Users, UserCheck, Shield, UserMinus } from "lucide-react";

interface SummaryStatsProps {
  users: User[];
}

export default function SummaryStats({ users }: SummaryStatsProps) {
  const total = users.length;
  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = total - activeCount;
  const adminCount = users.filter((u) => u.role === "admin").length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Users */}
      <div 
        className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-slate-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 shadow-sm transition-all duration-250 flex items-center gap-4 group cursor-default"
      >
        <div className="p-3 bg-slate-100 dark:bg-gray-800 text-brand-600 dark:text-brand-400 rounded-lg group-hover:bg-brand-600 group-hover:text-white dark:group-hover:bg-brand-500 transition-all duration-250">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">TOTAL PENGGUNA</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{total}</p>
        </div>
      </div>

      {/* Active Users */}
      <div 
        className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-slate-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-sm transition-all duration-250 flex items-center gap-4 group cursor-default"
      >
        <div className="p-3 bg-slate-100 dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 rounded-lg group-hover:bg-emerald-600 group-hover:text-white dark:group-hover:bg-emerald-500 transition-all duration-250">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">AKTIF</p>
          <div className="flex items-baseline gap-1 mt-1.5 leading-none">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{activeCount}</span>
            <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">/{total}</span>
          </div>
        </div>
      </div>

      {/* Admin Users */}
      <div 
        className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-slate-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm transition-all duration-250 flex items-center gap-4 group cursor-default"
      >
        <div className="p-3 bg-slate-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-500 transition-all duration-250">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">ADMINISTRATOR</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{adminCount}</p>
        </div>
      </div>

      {/* Inactive Users */}
      <div 
        className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-slate-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700 shadow-sm transition-all duration-250 flex items-center gap-4 group cursor-default"
      >
        <div className="p-3 bg-slate-100 dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-all duration-250">
          <UserMinus className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">NONAKTIF</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{inactiveCount}</p>
        </div>
      </div>
    </div>
  );
}
