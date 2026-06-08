import React, { useState } from "react";
import Link from "next/link";
import { Search, Plus, Loader2 } from "lucide-react";
import { FilterStatus, STATUS_CONFIG, TournamentStatus } from "@/app/admin/tournaments/types";
import DatePicker from "@/components/form/DatePicker";

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "Semua" },
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
  tournamentDate,
  setTournamentDate,
  pageSize,
  setPageSize,
}: TournamentFiltersProps) {
  const [navigatingAdd, setNavigatingAdd] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col lg:flex-row lg:items-center lg:flex-wrap xl:flex-nowrap gap-3">
      {/* Filter Tanggal */}
      <div className="flex shrink-0 w-full lg:w-40">
        <DatePicker
          value={tournamentDate || ""}
          onChange={(val) => setTournamentDate(val)}
          placeholder="Pilih Tanggal"
        />
      </div>

      {/* Status Dropdown */}
      <div className="flex shrink-0 w-full lg:w-auto">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as FilterStatus)}
          className="w-full lg:w-auto px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition cursor-pointer"
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="relative flex-1 min-w-[150px] w-full lg:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama turnamen atau lokasi..."
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
          {[5, 10, 25, 50, 100].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Add Button */}
      <div className="flex shrink-0">
        <Link
          href="/admin/tournaments/add"
          id="btn-add-tournament"
          onClick={() => setNavigatingAdd(true)}
          className="inline-flex w-full lg:w-auto items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors shadow-sm"
        >
          {navigatingAdd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Tambah Turnamen
        </Link>
      </div>
    </div>
  );
}
