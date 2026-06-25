import React from "react";
import { toast } from "react-toastify";
import { Search, SlidersHorizontal, X, Plus } from "lucide-react";
import DatePicker from "@/components/form/DatePicker";

interface MatchFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  phase: string;
  setPhase: (val: string) => void;
  group: string;
  setGroup: (val: string) => void;
  groups: string[];
  tournamentDate: string;
  setTournamentDate: (val: string) => void;
  tournamentId: string;
  setTournamentId: (val: string) => void;
  tournaments: { id: string; name: string }[];
}

export default function MatchFilters({
  search,
  setSearch,
  status,
  setStatus,
  phase,
  setPhase,
  group,
  setGroup,
  groups,
  tournamentDate,
  setTournamentDate,
  tournamentId,
  setTournamentId,
  tournaments,
}: MatchFiltersProps) {
  const isFiltered = status !== "" || phase !== "" || group !== "" || search !== "" || tournamentDate !== "" || tournamentId !== "";

  const handleClearFilters = () => {
    setStatus("");
    setPhase("");
    setGroup("");
    setSearch("");
    setTournamentDate("");
    setTournamentId("");
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
            placeholder="Cari tim atau turnamen..."
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
        {/* Tournament Filter */}
        <div className="col-span-1">
          <label className={labelClass}>Turnamen</label>
          <select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)} className={inputClass}>
            <option value="">Semua Turnamen</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="col-span-1">
          <label className={labelClass}>Tanggal</label>
          <div className="relative">
            <DatePicker
              value={tournamentDate}
              onChange={(val) => setTournamentDate(val)}
              placeholder="Pilih Tanggal"
              className={inputClass}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="col-span-1">
          <label className={labelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="">Semua Status</option>
            <option value="scheduled">Dijadwalkan</option>
            <option value="ongoing">Berlangsung</option>
            <option value="completed">Selesai</option>
          </select>
        </div>

        {/* Phase Filter */}
        <div className="col-span-1">
          <label className={labelClass}>Fase</label>
          <select value={phase} onChange={(e) => setPhase(e.target.value)} className={inputClass}>
            <option value="">Semua Fase</option>
            <option value="RR">Grup (RR)</option>
            <option value="QF">Perempat Final</option>
            <option value="SF">Semi Final</option>
            <option value="3RD">Juara 3</option>
            <option value="F">Final</option>
          </select>
        </div>

        {/* Group Filter */}
        <div className="col-span-1">
          <label className={labelClass}>Grup</label>
          <select value={group} onChange={(e) => setGroup(e.target.value)} className={inputClass}>
            <option value="">Semua Grup</option>
            {groups.map((g) => (
              <option key={g} value={g}>Grup {g}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
