import React, { useState } from "react";
import Link from "next/link";
import { Search, Plus, Loader2 } from "lucide-react";

export type StatusFilter = "all" | "active" | "inactive";

interface TournamentTypeFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  status: StatusFilter;
  setStatus: (val: StatusFilter) => void;
  pageSize: number;
  setPageSize: (val: number) => void;
}

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "Semua",
  active: "Aktif",
  inactive: "Nonaktif",
};

export default function TournamentTypeFilters({
  search,
  setSearch,
  status,
  setStatus,
  pageSize,
  setPageSize,
}: TournamentTypeFiltersProps) {
  const [navigatingAdd, setNavigatingAdd] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-2 shrink-0">
        {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-4 py-1 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              status === s
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {STATUS_LABELS[s]}
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
          placeholder="Cari nama tipe turnamen..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
        />
      </div>

      {/* Page Size */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          Tampilkan:
        </span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
        >
          {[5, 10, 25, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Add Button */}
      <div className="flex shrink-0">
        <Link
          href="/admin/tournament-type/add"
          id="btn-add-tournament-type"
          onClick={() => setNavigatingAdd(true)}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors shadow-sm"
        >
          {navigatingAdd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Tambah Tipe
        </Link>
      </div>
    </div>
  );
}
