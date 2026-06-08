"use client";

import React from "react";
import { Filter, Search } from "lucide-react";
import DatePicker from "@/components/form/DatePicker";

interface Props {
  tournaments: { id: string; name: string }[];
  tournamentId: string;
  onTournamentChange: (val: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  date: string;
  onDateChange: (val: string) => void;
}

export default function PointHistoryFilters({
  tournaments,
  tournamentId,
  onTournamentChange,
  search,
  onSearchChange,
  date,
  onDateChange,
}: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      {/* <Filter className="w-4 h-4 text-gray-400 shrink-0" /> */}

      {/* Filter Tanggal */}
      <div className="w-full sm:w-40">
        <DatePicker
          value={date || ""}
          onChange={onDateChange}
          placeholder="Pilih Tanggal"
        />
      </div>

      {/* Tournament Select */}
      {/* <select
        value={tournamentId}
        onChange={(e) => onTournamentChange(e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition cursor-pointer"
      >
        <option value="">— Pilih Turnamen —</option>
        {tournaments.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select> */}

      {/* Player Search */}
      <div className="relative w-full sm:w-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari nama pemain..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full sm:w-60 pl-9 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition"
        />
      </div>
    </div>
  );
}
