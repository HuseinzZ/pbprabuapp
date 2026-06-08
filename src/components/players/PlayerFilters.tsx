import React, { useState } from "react";
import Link from "next/link";
import { Search, Plus, Loader2, RefreshCcw } from "lucide-react";
import { FilterLevel, LEVEL_LABELS } from "@/app/admin/players/types";

interface PlayerFiltersProps {
  filter: FilterLevel;
  setFilter: (val: FilterLevel) => void;
  search: string;
  setSearch: (val: string) => void;
  pageSize: number;
  setPageSize: (val: number) => void;
  onAddPlayer?: () => void;
  onSyncPoints?: () => void;
  syncing?: boolean;
}

export default function PlayerFilters({
  filter,
  setFilter,
  search,
  setSearch,
  pageSize,
  setPageSize,
  onAddPlayer,
  onSyncPoints,
  syncing,
}: PlayerFiltersProps) {
  const [navigatingAdd, setNavigatingAdd] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Level Filter Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-2 overflow-x-auto shrink-0">
        {(Object.keys(LEVEL_LABELS) as FilterLevel[]).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilter(lvl)}
            className={`px-4 py-1 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${filter === lvl
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
          >
            {LEVEL_LABELS[lvl]}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pencarian"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
        />
      </div>

      {/* Page Size Filter */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          Tampilkan:
        </span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
        >
          {[5, 10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {onSyncPoints && (
          <button
            onClick={onSyncPoints}
            disabled={syncing}
            title="Sinkronisasi poin dari riwayat poin"
            className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-gray-600 hover:text-brand-500 dark:text-gray-300 dark:hover:text-brand-400 disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCcw className={`w-4 h-4 ${syncing ? 'animate-spin text-brand-500' : ''}`} />
          </button>
        )}
        
        {onAddPlayer ? (
          <button
            onClick={() => {
              setNavigatingAdd(true);
              onAddPlayer();
            }}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors shadow-sm"
          >
            {navigatingAdd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Tambah Pemain
          </button>
        ) : (
          <Link
            href="/admin/players/add"
            onClick={() => setNavigatingAdd(true)}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors shadow-sm"
          >
            {navigatingAdd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Tambah Pemain
          </Link>
        )}
      </div>
    </div>
  );
}
