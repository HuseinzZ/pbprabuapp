"use client";
import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import { Search, ChevronDown, Calendar } from "lucide-react";
import SponsorSection from "@/components/users/SponsorSection";
import Loader from "@/components/shared/Loader";
import DatePicker from "@/components/form/DatePicker";

type MatchRaw = {
  id: string;
  created_at: string;
  team1_score: number;
  team2_score: number;
  status: string;
  tournament_id: string | null;
  tournaments: { id: string; name: string; start_date?: string } | null;
  team1?: {
    name?: string;
    p1?: { fullname: string } | null;
    p2?: { fullname: string } | null;
  } | null;
  team2?: {
    name?: string;
    p1?: { fullname: string } | null;
    p2?: { fullname: string } | null;
  } | null;
};

type Tournament = { id: string; name: string };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

const STATUS_DOT: Record<string, string> = {
  scheduled: "bg-amber-400",
  ongoing: "bg-emerald-400 animate-pulse",
  completed: "bg-gray-400",
};

// CustomSelect component identical to Rankings page
const CustomSelect = ({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  label?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {label && <label className="block text-[10px] font-medium text-slate-500 mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-transparent text-sm font-medium focus:outline-none text-slate-900 dark:text-white"
      >
        <span className="truncate pr-2">{selectedOption?.label}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[180px] bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto p-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
                className={`w-full text-left px-3 py-2.5 text-[11px] sm:text-xs rounded-lg transition-colors ${value === opt.value
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 font-bold"
                    : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700/50"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function PublicMatchesPage() {
  const [matches, setMatches] = useState<MatchRaw[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tournamentFilter, setTournamentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(""); // ISO date string YYYY-MM-DD
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [isInitialized, setIsInitialized] = useState(false);
  const initRef = useRef(false);
  const supabase = createClient();

  // Initialize with latest tournament
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    async function fetchInitial() {
      const { data: latestTournaments } = await supabase
        .from("tournaments")
        .select("id, start_date")
        .order("start_date", { ascending: false })
        .limit(1);

      if (latestTournaments && latestTournaments.length > 0) {
        const latestTournament = latestTournaments[0];
        if (latestTournament.start_date) {
          setDateFilter(latestTournament.start_date.slice(0, 10));
        }
        setTournamentFilter(latestTournament.id);
      }
      setIsInitialized(true);
    }
    fetchInitial();
  }, [supabase]);

  // Fetch matches whenever dateFilter changes (if empty, fetches latest overall)
  useEffect(() => {
    if (!isInitialized) return;
    async function fetchMatches() {
      setLoading(true);

      let query = supabase
        .from("matches")
        .select(`
          id, created_at, team1_score:score_team1, team2_score:score_team2, status, tournament_id,
          tournaments!inner(id, name, start_date),
          team1:teams!team1_id(
            name,
            p1:profile!teams_player1_id_fkey(fullname),
            p2:profile!teams_player2_id_fkey(fullname)
          ),
          team2:teams!team2_id(
            name,
            p1:profile!teams_player1_id_fkey(fullname),
            p2:profile!teams_player2_id_fkey(fullname)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (dateFilter) {
        const from = new Date(dateFilter);
        from.setHours(0, 0, 0, 0);
        const to = new Date(dateFilter);
        to.setHours(23, 59, 59, 999);
        query = query.gte("tournaments.start_date", from.toISOString()).lte("tournaments.start_date", to.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Gagal memuat pertandingan.");
        console.error(error);
      }
      const result = (data as any) || [];
      setMatches(result);

      // Rebuild tournament list
      const seen = new Map<string, string>();
      result.forEach((m: MatchRaw) => {
        if (m.tournaments?.id && m.tournaments?.name) {
          seen.set(m.tournaments.id, m.tournaments.name);
        }
      });
      setTournaments(Array.from(seen.entries()).map(([id, name]) => ({ id, name })));

      setTournamentFilter((prev) => {
        if (prev !== "all" && !seen.has(prev)) return "all";
        return prev;
      });

      setLoading(false);
    }
    fetchMatches();
  }, [dateFilter, supabase, isInitialized]);

  const getTeamName = (team: any, defaultName: string) => {
    if (!team) return defaultName;
    if (team.name && team.name !== "Tim Baru") {
      return team.name.replace(/\s*\/\s*/g, ' & ');
    }
    const p1 = team.p1?.fullname;
    const p2 = team.p2?.fullname;
    if (p1 && p2) return `${p1} & ${p2}`;
    if (p1) return p1;
    return defaultName;
  };

  // Client-side filtering
  const filtered = matches.filter(m => {
    const term = searchTerm.toLowerCase();
    const t1Name = getTeamName(m.team1, "").toLowerCase();
    const t2Name = getTeamName(m.team2, "").toLowerCase();
    const tourney = m.tournaments?.name?.toLowerCase() || "";

    const matchesSearch = t1Name.includes(term) || t2Name.includes(term) || tourney.includes(term);
    const matchesTournament = tournamentFilter === "all" || m.tournament_id === tournamentFilter;

    return matchesSearch && matchesTournament;
  });

  // Group by date
  const grouped = filtered.reduce<Record<string, MatchRaw[]>>((acc, m) => {
    const rawDate = m.tournaments?.start_date || m.created_at;
    const key = rawDate ? rawDate.slice(0, 10) : "Unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const groupedEntries = Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a));

  const tournamentOptions = [
    { value: "all", label: "Semua Turnamen" },
    ...tournaments.map(t => ({ value: t.id, label: t.name })),
  ];

  const handleClearDate = () => {
    // Reset date filter and initRef to trigger latest fetch again
    setDateFilter("");
    initRef.current = false;
  };

  return (
    <div className="pt-24 md:pt-32 pb-16 min-h-screen page-fade-in bg-white dark:bg-gray-900">
      <div className="px-4 md:px-8 xl:px-16 max-w-[1440px] mx-auto">
        {/* Header */}
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            Jadwal & Hasil Pertandingan
          </h1>
          <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">Jadwal pertandingan badminton dan hasil pertandingan</p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-slate-200/50 dark:bg-zinc-800/50 rounded-xl p-1">
            {(["table", "card"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === mode
                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300"
                  }`}
              >
                {mode === "table" ? "Tabel" : "Kartu"}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white dark:bg-gray-800/40 p-4 sm:p-6 border border-gray-200 dark:border-gray-800 rounded-t-xl border-b-0 relative z-10">
          <div className="grid grid-cols-2 md:flex md:flex-row flex-wrap lg:flex-nowrap items-end gap-4 sm:gap-6 w-full">
            {/* Search */}
            <div className="col-span-2 md:flex-1 w-full border-b border-slate-300 dark:border-zinc-700 pb-1.5">
              <label className="block text-[10px] font-medium text-slate-500 mb-1">&nbsp;</label>
              <div className="flex items-center">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Cari pemain atau turnamen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Tournament Filter */}
            <div className="col-span-1 md:w-52 border-b border-slate-300 dark:border-zinc-700 pb-1.5">
              <CustomSelect
                label="Turnamen"
                value={tournamentFilter}
                onChange={setTournamentFilter}
                options={tournamentOptions}
              />
            </div>

            {/* Date Filter */}
            <div className="col-span-1 md:w-48 border-b border-slate-300 dark:border-zinc-700 pb-1.5">
              <label className="block text-[10px] font-medium text-slate-500 mb-1">Tanggal</label>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="w-full">
                  <DatePicker
                    value={dateFilter}
                    onChange={setDateFilter}
                    placeholder="Semua waktu"
                    className="w-full bg-transparent text-sm font-medium focus:outline-none text-slate-900 dark:text-white cursor-pointer placeholder:text-slate-400 shadow-none border-0 p-0"
                  />
                </div>
                {dateFilter && (
                  <button
                    onClick={handleClearDate}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 text-xs font-bold ml-1 shrink-0"
                    title="Reset tanggal"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-b-xl shadow-sm flex flex-col overflow-hidden min-h-[400px] p-4 sm:p-6 mb-16">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-slate-500 font-medium">
              Tidak ada pertandingan ditemukan{dateFilter ? ` pada tanggal ${formatDate(dateFilter)}` : ""}.
            </div>
          ) : viewMode === "table" ? (
            /* ── Table view ── */
            <div className="space-y-8">
              {groupedEntries.map(([date, dayMatches]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-bold text-slate-700 dark:text-gray-300 uppercase tracking-widest px-2 py-1 bg-slate-100 dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
                      {formatDate(date)}
                    </span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-700" />
                  </div>

                  <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-slate-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                          <tr>
                            <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:table-cell">Turnamen</th>
                            <th className="px-5 py-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tim 1</th>
                            <th className="px-5 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Skor</th>
                            <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tim 2</th>
                            <th className="px-5 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:table-cell">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-gray-800/50">
                          {dayMatches.map((m) => {
                            const isDone = m.status === "completed";
                            return (
                              <tr key={m.id} className="transition-colors">
                                <td className="px-5 py-4 hidden sm:table-cell">
                                  <span className="text-xs font-medium text-slate-500 dark:text-zinc-400 truncate max-w-[160px] block">
                                    {m.tournaments?.name || "Latihan Bersama"}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                                    {getTeamName(m.team1, "Tim 1")}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-center whitespace-nowrap">
                                  {isDone ? (
                                    <span className="font-black text-lg text-brand-600 dark:text-brand-400">
                                      {m.team1_score || 0} — {m.team2_score || 0}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 dark:text-zinc-500 font-bold text-xs uppercase">vs</span>
                                  )}
                                </td>
                                <td className="px-5 py-4">
                                  <span className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                                    {getTeamName(m.team2, "Tim 2")}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-center whitespace-nowrap hidden sm:table-cell">
                                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
                                    <span className={`w-2 h-2 rounded-full shadow-sm ${STATUS_DOT[m.status] || "bg-gray-400"}`} />
                                    {isDone ? "Selesai" : m.status === "ongoing" ? "Berlangsung" : "Mendatang"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Card view (Grid UI from Reference) ── */
            <div className="space-y-8">
              {groupedEntries.map(([date, dayMatches]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-bold text-slate-700 dark:text-gray-300 uppercase tracking-widest px-2 py-1 bg-slate-100 dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
                      {formatDate(date)}
                    </span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-zinc-700" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 xl:gap-6">
                    {dayMatches.map((m) => {
                      const isDone = m.status === "completed";
                      const isOngoing = m.status === "ongoing";
                      const rawDate = m.tournaments?.start_date || m.created_at;
                      const dateStr = rawDate.slice(0, 10);

                      return (
                        <article
                          key={m.id}
                          className="relative flex flex-col justify-center bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm transition-all overflow-hidden group"
                        >
                          {/* Dotted Background Pattern for Dark Mode */}
                          <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

                          {/* Top Bar: Status, Tournament, DateTime */}
                          <div className="relative flex justify-between items-start mb-6 w-full gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`shrink-0 inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${isOngoing
                                  ? "bg-red-600 text-white"
                                  : isDone
                                    ? "bg-zinc-700 text-zinc-300"
                                    : "bg-amber-500 text-amber-950"
                                }`}>
                                {isOngoing ? "LIVE" : isDone ? "SELESAI" : "MENDATANG"}
                              </span>
                              <p className="text-slate-600 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-widest truncate">
                                {m.tournaments?.name || "Latihan Bersama"}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500 dark:text-zinc-500 shrink-0">
                              <Calendar className="w-3 h-3" />
                              <span>{dateStr}</span>
                            </div>
                          </div>

                          {/* Center Body: Teams & Score */}
                          <div className="relative flex items-center justify-between gap-3 mb-2">
                            {/* Team 1 */}
                            <div className="flex-1 flex flex-col items-end min-w-0">
                              <span className="text-right text-base sm:text-lg font-medium text-slate-900 dark:text-white truncate w-full">
                                {getTeamName(m.team1, "Tim 1")}
                              </span>
                            </div>

                            {/* Score Pill */}
                            <div className="shrink-0 flex items-center justify-center px-5 py-2 rounded-[2rem] border border-slate-300 dark:border-zinc-700/80 bg-slate-50 dark:bg-zinc-900/40 min-w-[80px]">
                              {isDone ? (
                                <span className="font-black text-xl tracking-widest text-brand-600 dark:text-amber-500">
                                  {m.team1_score || 0} : {m.team2_score || 0}
                                </span>
                              ) : isOngoing ? (
                                <span className="font-black text-xl tracking-widest text-brand-600 dark:text-amber-500">
                                  {m.team1_score || 0} : {m.team2_score || 0}
                                </span>
                              ) : (
                                <span className="font-bold text-sm tracking-widest text-slate-400 dark:text-zinc-500">
                                  VS
                                </span>
                              )}
                            </div>

                            {/* Team 2 */}
                            <div className="flex-1 flex flex-col items-start min-w-0">
                              <span className="text-left text-base sm:text-lg font-medium text-slate-900 dark:text-white truncate w-full">
                                {getTeamName(m.team2, "Tim 2")}
                              </span>
                            </div>
                          </div>

                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SponsorSection />
    </div>
  );
}
