import React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { FilterLevel, LEVEL_LABELS } from "@/app/admin/players/types";

interface PlayerFiltersProps {
  filter: FilterLevel;
  setFilter: (val: FilterLevel) => void;
  search: string;
  setSearch: (val: string) => void;
  pageSize: number;
  setPageSize: (val: number) => void;
  onAddPlayer?: () => void;
}

export default function PlayerFilters({
  filter,
  setFilter,
  search,
  setSearch,
  pageSize,
  setPageSize,
  onAddPlayer,
}: PlayerFiltersProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Level Filter Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 overflow-x-auto shrink-0">
        {(Object.keys(LEVEL_LABELS) as FilterLevel[]).map((lvl) => (
          <button
            key={lvl}
            onClick={() => setFilter(lvl)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${filter === lvl
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pencarian"
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
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
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
        >
          {[5, 10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Add Player Button */}
      <div className="flex shrink-0">
        {onAddPlayer ? (
          <button
            onClick={onAddPlayer}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Pemain
          </button>
        ) : (
          <Link
            href="/admin/players/add"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Pemain
          </Link>
        )}
      </div>
    </div>
  );
}
