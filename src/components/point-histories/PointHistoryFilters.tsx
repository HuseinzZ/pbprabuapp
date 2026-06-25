"use client";

import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { toast } from "react-toastify";
import DatePicker from "@/components/form/DatePicker";

interface Props {
  tournaments: { id: string; name: string }[];
  tournamentId: string;
  onTournamentChange: (val: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  date: string;
  onDateChange: (val: string) => void;
  sort: string;
  onSortChange: (val: string) => void;
}

export default function PointHistoryFilters({
  tournaments,
  tournamentId,
  onTournamentChange,
  search,
  onSearchChange,
  date,
  onDateChange,
  sort,
  onSortChange,
}: Props) {
  const isFiltered = search !== "" || date !== "" || tournamentId !== "" || sort !== "points-desc";

  const handleClearFilters = () => {
    onSearchChange("");
    onDateChange("");
    onTournamentChange("");
    onSortChange("points-desc");
    toast.info("Seluruh filter berhasil dihapus!");
  };

  const inputClass = "w-full px-3 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-gray-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none cursor-pointer transition-all";
  const labelClass = "block text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1.5";

  return (
    <div className="p-5 border-b border-slate-200 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/50 space-y-4 rounded-t-lg">
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-gray-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari nama pemain..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-10 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:focus:ring-brand-500/20 outline-none rounded-lg text-xs transition-all dark:text-white"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Clear filter shortcut */}
        {isFiltered && (
          <button
            onClick={handleClearFilters}
            className="text-[10px] uppercase tracking-wider font-bold text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 flex items-center gap-1.5 shrink-0 hover:underline cursor-pointer transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Hapus Filter
          </button>
        )}
      </div>

      {/* Secondary Filters Dropdown Rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* Tournament Filter */}
        <div className="col-span-1 lg:col-span-2">
          <label className={labelClass}>Turnamen</label>
          <select value={tournamentId} onChange={(e) => onTournamentChange(e.target.value)} className={inputClass}>
            <option value="">Semua Turnamen</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="col-span-1 lg:col-span-1">
          <label className={labelClass}>Tanggal</label>
          <div className="relative">
            <DatePicker
              value={date}
              onChange={(val) => onDateChange(val)}
              placeholder="Pilih Tanggal"
              className={inputClass}
            />
          </div>
        </div>

        {/* Sort Filter */}
        <div className="col-span-1 lg:col-span-1">
          <label className={labelClass}>Urutan</label>
          <select value={sort} onChange={(e) => onSortChange(e.target.value)} className={inputClass}>
            <option value="points-desc">Poin Tertinggi</option>
            <option value="points-asc">Poin Terendah</option>
            <option value="name-asc">Nama (A-Z)</option>
            <option value="name-desc">Nama (Z-A)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
