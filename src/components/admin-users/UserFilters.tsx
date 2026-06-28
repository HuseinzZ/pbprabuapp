import React from "react";
import Link from "next/link";
import { Search, Plus, RefreshCcw, SlidersHorizontal, X } from "lucide-react";
import { FilterLevel, LEVEL_LABELS } from "@/app/admin/users/types";

interface UserFiltersProps {
  filter: FilterLevel;
  setFilter: (val: FilterLevel) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  search: string;
  setSearch: (val: string) => void;
  pageSize: number;
  setPageSize: (val: number) => void;
  onAddPlayer?: () => void;
  onSyncPoints?: () => void;
  onClearFilters?: () => void;
  syncing?: boolean;
}

export default function UserFilters({
  filter,
  setFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  search,
  setSearch,
  pageSize,
  setPageSize,
  onAddPlayer,
  onSyncPoints,
  onClearFilters,
  syncing,
}: UserFiltersProps) {
  const isFiltered = filter !== "all" || statusFilter !== "all" || sortBy !== "name_asc" || search !== "";

  const handleClearFilters = () => {
    if (onClearFilters) {
      onClearFilters();
      setSearch("");
      return;
    }
    setFilter("all");
    setStatusFilter("all");
    setSortBy("name_asc");
    setSearch("");
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
            placeholder="Cari berdasarkan nama, email, username..."
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
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
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
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        {/* Level Filter */}
        <div className="col-span-1">
          <label className={labelClass}>Level</label>
          <select value={filter} onChange={(e) => setFilter(e.target.value as FilterLevel)} className={inputClass}>
            {(Object.keys(LEVEL_LABELS) as FilterLevel[]).map((lvl) => (
              <option key={lvl} value={lvl}>{LEVEL_LABELS[lvl]}</option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="col-span-1 md:col-span-1 lg:col-span-1">
          <label className={labelClass}>Urutan</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={inputClass}>
            <option value="name_asc">Nama Lengkap (A - Z)</option>
            <option value="name_desc">Nama Lengkap (Z - A)</option>
            <option value="username_asc">Username (A - Z)</option>
            <option value="username_desc">Username (Z - A)</option>
            <option value="email_asc">Email (A - Z)</option>
            <option value="joined_desc">Tanggal Terdaftar (Terbaru)</option>
            <option value="joined_asc">Tanggal Terdaftar (Paling Lama)</option>
            <option value="points_desc">Poin (Tertinggi)</option>
          </select>
        </div>

        <div className="col-span-2 md:col-span-4 lg:col-span-2 flex items-end justify-end gap-2">
           {onSyncPoints && (
            <button
              onClick={onSyncPoints}
              disabled={syncing}
              title="Sinkronisasi poin dari riwayat"
              className="px-3 py-2 border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-slate-700 dark:text-gray-300 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition duration-150 cursor-pointer disabled:opacity-50"
            >
              <RefreshCcw className={`w-3.5 h-3.5 text-slate-400 dark:text-gray-500 ${syncing ? 'animate-spin text-brand-500' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>
          )}

          {onAddPlayer ? (
            <button
              onClick={onAddPlayer}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Tambah
            </button>
          ) : (
            <Link
              href="/admin/users/add"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Tambah
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
