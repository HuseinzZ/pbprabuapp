import React, { useState } from "react";
import Link from "next/link";
import { Search, Plus, Loader2, SlidersHorizontal, X } from "lucide-react";
import { FilterStatus } from "@/app/admin/tournaments/types";
import DatePicker from "@/components/form/DatePicker";

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "upcoming", label: "Akan Datang" },
  { value: "registration", label: "Pendaftaran" },
  { value: "ongoing", label: "Berlangsung" },
  { value: "completed", label: "Selesai" },
  { value: "cancelled", label: "Dibatalkan" },
];

interface TournamentFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  status: FilterStatus;
  setStatus: (val: FilterStatus) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  tournamentDate: string;
  setTournamentDate: (val: string) => void;
  pageSize: number;
  setPageSize: (val: number) => void;
}

export default function TournamentFilters({
  search,
  setSearch,
  status,
  setStatus,
  sortBy,
  setSortBy,
  tournamentDate,
  setTournamentDate,
  pageSize,
  setPageSize,
}: TournamentFiltersProps) {
  const [navigatingAdd, setNavigatingAdd] = useState(false);

  const isFiltered = status !== "all" || tournamentDate !== "" || search !== "" || sortBy !== "date_desc";

  const handleClearFilters = () => {
    setStatus("all");
    setTournamentDate("");
    setSearch("");
    setSortBy("date_desc");
  };

  const inputClass = "w-full px-3 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:focus:ring-brand-500/20 outline-none rounded-lg text-xs transition-all dark:text-white";
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
            placeholder="Cari nama turnamen atau lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-10 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:focus:ring-brand-500/20 outline-none rounded-lg text-xs transition-all dark:text-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
        {/* Page Size Filter */}
        <div className="col-span-1">
          <label className={labelClass}>Tampilkan</label>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className={inputClass}>
            <option value={5}>5 Data</option>
            <option value={10}>10 Data</option>
            <option value={25}>25 Data</option>
            <option value={50}>50 Data</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="col-span-1">
          <label className={labelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as FilterStatus)} className={inputClass}>
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        {/* <div className="col-span-1">
          <label className={labelClass}>Tanggal Mulai</label>
          <div className="relative">
            <DatePicker
              id="tournament-date"
              value={tournamentDate}
              onChange={(val) => setTournamentDate(val)}
              placeholder="Pilih Tanggal"
            />
          </div>
        </div> */}

        {/* Sort By */}
        <div className="col-span-1">
          <label className={labelClass}>Urutan</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={inputClass}>
            <option value="date_desc">Tanggal (Terbaru)</option>
            <option value="date_asc">Tanggal (Terlama)</option>
            <option value="name_asc">Nama (A - Z)</option>
            <option value="name_desc">Nama (Z - A)</option>
            <option value="prize_desc">Hadiah (Tertinggi)</option>
          </select>
        </div>

        <div className="col-span-2 md:col-span-4 lg:col-span-1 flex items-end gap-2">
          <Link
            href="/admin/tournaments/add"
            onClick={() => setNavigatingAdd(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer w-full sm:w-auto"
          >
            {navigatingAdd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Tambah
          </Link>
        </div>
      </div>
    </div>
  );
}
