"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Plus, Loader2 } from "lucide-react";
import {
  FilterParticipantStatus,
  STATUS_FILTER_OPTIONS,
} from "@/app/admin/participant/types";
import DatePicker from "@/components/form/DatePicker";

interface ParticipantFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  status: FilterParticipantStatus;
  setStatus: (val: FilterParticipantStatus) => void;
  tournamentDate: string;
  setTournamentDate: (val: string) => void;
  tournamentId: string;
  setTournamentId: (val: string) => void;
  tournaments: { id: string; name: string }[];
  pageSize: number;
  setPageSize: (val: number) => void;
}

export default function ParticipantFilters({
  search,
  setSearch,
  status,
  setStatus,
  tournamentDate,
  setTournamentDate,
  tournamentId, // Jika tidak dipakai di UI, biarkan saja sesuai props bawaan
  setTournamentId,
  tournaments,
  pageSize,
  setPageSize,
}: ParticipantFiltersProps) {
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
          value={status || "all"}
          onChange={(e) => setStatus(e.target.value as FilterParticipantStatus)}
          className="w-full lg:w-auto px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition cursor-pointer"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
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
          value={search || ""}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari pemain..."
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
          href={`/admin/participant/add${tournamentDate && tournaments.length > 0 ? `?tournament_id=${tournaments[0].id}` : ""}`}
          onClick={() => setNavigatingAdd(true)}
          className="inline-flex w-full lg:w-auto items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors shadow-sm"
        >
          {navigatingAdd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Tambah Peserta
        </Link>
      </div>
    </div>
  );
}