"use client";
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import Image from "next/image";
import { Info, BarChart3, Trophy, X, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, Share2, Check, Loader2 } from "lucide-react";
import { toBlob } from "html-to-image";
import SponsorSection from "@/components/users/SponsorSection";
import Loader from "@/components/shared/Loader";

type Player = {
  id: string;
  fullname: string;
  username: string | null;
  level: string | null;
  ranking_points: number;
  avatar_url: string | null;
  tournament_count?: number; // Calculated later
  win_rate?: number; // Calculated for tie-breaking
};

type Match = {
  id: string;
  score_team1: number;
  score_team2: number;
  team1_id: string;
  team2_id: string;
  created_at: string;
  teams_team1?: { name: string } | null;
  teams_team2?: { name: string } | null;
};

const MEDAL = ["🥇", "🥈", "🥉"];

const generateWeekOptions = () => {
  const opts = [];
  const today = new Date();
  
  // Calculate the most recent Monday
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(today.setDate(diff));

  for (let i = -4; i <= 0; i++) {
    const weekStart = new Date(monday.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000); // Sunday

    const d = weekEnd.getDate().toString().padStart(2, '0');
    const m = (weekEnd.getMonth() + 1).toString().padStart(2, '0');
    const y = weekEnd.getFullYear();
    const dateString = `${d}-${m}-${y}`; 
    const valueString = weekEnd.toISOString().split('T')[0];
    
    // Calculate ISO Week Number
    const target = new Date(weekStart.getTime() + 3 * 24 * 3600 * 1000); // Thursday
    const firstJan = new Date(target.getFullYear(), 0, 1);
    const dayDiff = Math.round((target.getTime() - firstJan.getTime()) / 86400000);
    const weekNum = 1 + Math.floor(dayDiff / 7);

    const label = `Minggu ${weekNum} (${dateString})`;
    
    opts.push({ label, value: valueString });
  }
  
  return opts.reverse();
};

const LEVEL_OPTIONS = [
  { value: "all", label: "Semua Level" },
  { value: "utama", label: "Utama" },
  { value: "pratama", label: "Pratama" }
];

const PAGE_SIZE_OPTIONS = [
  { value: 5, label: "5" },
  { value: 10, label: "10" },
  { value: 25, label: "25" },
  { value: 50, label: "50" },
  { value: 100, label: "100" }
];

const CustomSelect = ({ 
  value, 
  onChange, 
  options, 
  label 
}: { 
  value: string | number; 
  onChange: (val: any) => void; 
  options: { value: string | number; label: string }[]; 
  label?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

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
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-full min-w-[140px] bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-[11px] sm:text-xs rounded-lg transition-colors ${
                  value === opt.value
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

function getInitials(nameStr: string) {
  const parts = nameStr.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Avatar({ player, size = "md" }: { player: Player; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "w-10 h-10 text-sm", md: "w-12 h-12 text-base", lg: "w-20 h-20 text-2xl" };
  return (
    <div className={`${sizes[size]} shrink-0 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-white font-bold flex items-center justify-center relative overflow-hidden shadow-sm`}>
      {player.avatar_url ? (
        <Image src={player.avatar_url} alt={player.fullname} fill className="object-cover" unoptimized />
      ) : (
        getInitials(player.fullname)
      )}
    </div>
  );
}

export default function RankingsPage() {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [pointHistories, setPointHistories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Filtering & Pagination State
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("");
  const [weekOptions, setWeekOptions] = useState<{label: string, value: string}[]>([{ label: "Memuat...", value: "" }]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal State
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedPlayerRank, setSelectedPlayerRank] = useState<number | null>(null);
  const [playerMatches, setPlayerMatches] = useState<Match[]>([]);
  const [playerTeamIds, setPlayerTeamIds] = useState<string[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // For portal and hydration
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const opts = generateWeekOptions();
    setWeekOptions(opts);
    setTimeFilter(opts[0]?.value || "");
  }, []);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchRankings() {
      // Fetch players
      const { data: profileData, error: profileError } = await supabase
        .from("profile")
        .select("id, fullname, username, level, ranking_points, avatar_url")
        .eq("is_active", true)
        .order("ranking_points", { ascending: false });

      if (profileError) {
        toast.error("Gagal memuat data ranking. Coba lagi.");
        setLoading(false);
        return;
      }

      // Fetch point histories for dynamic week calculation
      const { data: historyData } = await supabase
        .from("point_histories")
        .select("player_id, points_earned, created_at, tournament_id");
      
      setPointHistories(historyData || []);

      // Fetch tournaments participants to count unique tournaments per player
      const { data: tpData } = await supabase
        .from("tournament_participants")
        .select("profile_id, tournament_id")
        .eq("status", "confirmed");

      const tpCountMap: Record<string, number> = {};
      if (tpData) {
        const grouped = tpData.reduce((acc, row) => {
          if (!row.profile_id) return acc;
          if (!acc[row.profile_id]) acc[row.profile_id] = new Set();
          acc[row.profile_id].add(row.tournament_id);
          return acc;
        }, {} as Record<string, Set<string>>);
        
        for (const [pid, set] of Object.entries(grouped)) {
          tpCountMap[pid] = set.size;
        }
      }

      // Fetch all teams and matches to calculate global win rates for tie-breaking
      const { data: allTeams } = await supabase.from("teams").select("id, player1_id, player2_id");
      const { data: allMatches } = await supabase.from("matches").select("team1_id, team2_id, score_team1, score_team2").eq("status", "completed");

      const playerWinRateMap: Record<string, number> = {};
      
      if (allTeams && allMatches) {
        const playerTeams: Record<string, Set<string>> = {};
        allTeams.forEach(t => {
          if (t.player1_id) {
            if (!playerTeams[t.player1_id]) playerTeams[t.player1_id] = new Set();
            playerTeams[t.player1_id].add(t.id);
          }
          if (t.player2_id) {
            if (!playerTeams[t.player2_id]) playerTeams[t.player2_id] = new Set();
            playerTeams[t.player2_id].add(t.id);
          }
        });

        const teamWins: Record<string, number> = {};
        const teamMatches: Record<string, number> = {};
        allMatches.forEach(m => {
          const t1 = m.team1_id;
          const t2 = m.team2_id;
          if (t1) teamMatches[t1] = (teamMatches[t1] || 0) + 1;
          if (t2) teamMatches[t2] = (teamMatches[t2] || 0) + 1;
          
          if (m.score_team1 > m.score_team2) {
            if (t1) teamWins[t1] = (teamWins[t1] || 0) + 1;
          } else if (m.score_team2 > m.score_team1) {
            if (t2) teamWins[t2] = (teamWins[t2] || 0) + 1;
          }
        });

        (profileData || []).forEach(p => {
          const tIds = playerTeams[p.id] || new Set();
          let wins = 0;
          let total = 0;
          tIds.forEach(tId => {
            wins += teamWins[tId] || 0;
            total += teamMatches[tId] || 0;
          });
          playerWinRateMap[p.id] = total > 0 ? (wins / total) : 0;
        });
      }

      let enhancedPlayers = (profileData || []).map(p => ({
        ...p,
        tournament_count: tpCountMap[p.id] || 0,
        win_rate: playerWinRateMap[p.id] || 0
      }));

      // Sort globally by ranking_points DESC, then win_rate DESC
      enhancedPlayers.sort((a, b) => {
        if (b.ranking_points !== a.ranking_points) {
          return b.ranking_points - a.ranking_points;
        }
        return (b.win_rate || 0) - (a.win_rate || 0);
      });

      setPlayers(enhancedPlayers);
      setLoading(false);
    }
    fetchRankings();
  }, [supabase]);

  // Fetch single player's matches when modal opens
  const openBreakdown = async (player: Player, rank: number) => {
    setSelectedPlayer(player);
    setSelectedPlayerRank(rank);
    setLoadingMatches(true);
    setPlayerMatches([]);
    setShareSuccess(false);
    setPlayerTeamIds([]);

    try {
      // Step 1: Get all tournament_ids where this player earned points
      const { data: histData, error: histError } = await supabase
        .from("point_histories")
        .select("tournament_id")
        .eq("player_id", player.id);

      console.log("[Breakdown] histData:", histData, histError);

      const tournamentIds = [...new Set((histData || []).map((h: any) => h.tournament_id).filter(Boolean))];
      console.log("[Breakdown] tournamentIds:", tournamentIds);

      if (tournamentIds.length === 0) {
        // Fallback: try directly from tournament_participants
        const { data: tpData, error: tpErr } = await supabase
          .from("tournament_participants")
          .select("tournament_id")
          .eq("profile_id", player.id);
        
        console.log("[Breakdown] tpData fallback:", tpData, tpErr);
        const tIds = [...new Set((tpData || []).map((t: any) => t.tournament_id).filter(Boolean))];
        if (tIds.length === 0) {
          setLoadingMatches(false);
          return;
        }
        tournamentIds.push(...tIds);
      }

      // Step 2: For each tournament, find team_ids this player belongs to
      const allTeamIds: string[] = [];
      for (const tId of tournamentIds) {
        const { data: teamsData, error: teamsErr } = await supabase
          .from("teams")
          .select("id")
          .eq("tournament_id", tId)
          .or(`player1_id.eq.${player.id},player2_id.eq.${player.id}`);
        
        console.log(`[Breakdown] teams for tournament ${tId}:`, teamsData, teamsErr);
        if (teamsData) allTeamIds.push(...teamsData.map((t: any) => t.id));
      }

      console.log("[Breakdown] allTeamIds:", allTeamIds);

      if (allTeamIds.length === 0) {
        setLoadingMatches(false);
        return;
      }

      setPlayerTeamIds(allTeamIds);

      // Step 3: Get matches for those team_ids
      const { data: matchData, error: matchErr } = await supabase
        .from("matches")
        .select(`
          id, created_at, score_team1, score_team2, team1_id, team2_id,
          teams_team1:teams!team1_id(name),
          teams_team2:teams!team2_id(name)
        `)
        .or(`team1_id.in.(${allTeamIds.join(',')}),team2_id.in.(${allTeamIds.join(',')})`)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(10);

      console.log("[Breakdown] matchData:", matchData, matchErr);
      setPlayerMatches((matchData as any) || []);
    } catch (e) {
      console.error("[Breakdown] Error:", e);
    }

    setLoadingMatches(false);
  };

  const isWin = (match: Match, teamIds: string[]) => {
    const isTeam1 = teamIds.includes(match.team1_id);
    return isTeam1 ? match.score_team1 > match.score_team2 : match.score_team2 > match.score_team1;
  };

  const getLevelBadgeClass = (level: string) => {
    if (level.toLowerCase() === "utama") {
      return "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/20";
    }
    return "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-500 dark:border-orange-500/20";
  };

  // Dynamic Weekly Points Calculation
  const getDynamicPlayers = () => {
    let currentPlayers = players;
    
    // Level Filter
    if (levelFilter !== "all") {
      currentPlayers = currentPlayers.filter(p => p.level?.toLowerCase() === levelFilter);
    }

    if (timeFilter === "all") return currentPlayers;

    // Time Filter selected: Calculate points and tournaments dynamically up to the selected week's END (Sunday 23:59:59)
    if (timeFilter !== "all") {
      // Time Filter selected: Calculate points and tournaments dynamically up to the selected week's END (Sunday 23:59:59)
      const selectedDate = new Date(timeFilter); // This is now a Sunday
      // End of that week is end of day.
      const endOfWeek = new Date(selectedDate);
      endOfWeek.setHours(23, 59, 59, 999);
      
      currentPlayers = currentPlayers.map(p => {
        // filter histories up to endOfWeek
        const validHistories = pointHistories.filter(
          h => h.player_id === p.id && new Date(h.created_at) <= endOfWeek
        );

        const earned = validHistories.reduce((acc, h) => acc + (h.points_earned || 0), 0);
        // unique tournaments up to this date
        const tSet = new Set(validHistories.map(h => h.tournament_id));
        
        return {
          ...p,
          ranking_points: earned,
          tournament_count: tSet.size
        };
      });
    }

    // Sort: Ranking Points DESC, then Win Rate DESC
    currentPlayers.sort((a, b) => {
      if (b.ranking_points !== a.ranking_points) {
        return b.ranking_points - a.ranking_points;
      }
      return (b.win_rate || 0) - (a.win_rate || 0);
    });

    return currentPlayers;
  };

  const handleShareStats = async () => {
    if (!modalRef.current || !selectedPlayer) return;
    try {
      setIsSharing(true);
      const modal = modalRef.current;
      const body = modal.querySelector('.custom-scrollbar') as HTMLDivElement;
      
      // Temporarily remove constraints to capture full height
      const originalMaxH = modal.style.maxHeight;
      const originalOverflow = body ? body.style.overflow : '';
      
      modal.style.maxHeight = 'none';
      if (body) body.style.overflow = 'visible';

      // Wait for any animations and DOM updates
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const blob = await toBlob(modal, {
        cacheBust: true,
        backgroundColor: document.documentElement.classList.contains("dark") ? "#111827" : "#ffffff",
        style: { transform: "scale(1)", borderRadius: "24px" } // Use px for borderRadius when capturing
      });

      // Restore constraints
      modal.style.maxHeight = originalMaxH;
      if (body) body.style.overflow = originalOverflow;
      
      if (!blob) throw new Error("Failed to generate image");

      const file = new File([blob], `statistik-${selectedPlayer.fullname.replace(/\s+/g, '-')}.png`, { type: "image/png" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Statistik ${selectedPlayer.fullname}`,
          text: `Lihat statistik ${selectedPlayer.fullname} di PB Prabu Bandung!`,
          files: [file],
        });
      } else {
        // Fallback download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Gambar berhasil diunduh (perangkat tidak mendukung share langsung)");
      }
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (error) {
      console.error(error);
      toast.error("Gagal membagikan statistik");
    } finally {
      setIsSharing(false);
    }
  };



  // Client-side Filtering & Pagination
  const dynamicallyCalculatedPlayers = getDynamicPlayers();
  const filteredPlayers = dynamicallyCalculatedPlayers.filter(p => 
    p.fullname.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.username && p.username.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / pageSize));
  const paginatedPlayers = filteredPlayers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize, timeFilter, levelFilter]);

  if (!mounted) return null;

  return (
    <>
      <main className="page-fade-in bg-white dark:bg-gray-900 min-h-screen pb-10">
        <div className="pt-24 md:pt-32 pb-16 px-4 md:px-8 xl:px-16 max-w-[1440px] mx-auto min-h-[70vh]">
        
        {/* Header & Rules Section */}
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
            Leaderboard
          </h1>
          
          <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-left shadow-sm">
            <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-zinc-200 mb-2">
              <Info className="w-4 h-4 text-brand-500" />
              Peraturan Rankings
            </h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Poin diambil berdasarkan poin BWF Grade Two yang disesuaikan dengan aturan komunitas.
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-slate-200/50 dark:bg-zinc-800/50 rounded-xl p-1">
            {(["list", "grid"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-8 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  viewMode === mode
                    ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300"
                }`}
              >
                {mode === "list" ? "Tabel" : "Kartu"}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-white dark:bg-gray-800/40 p-4 sm:p-6 border border-gray-200 dark:border-gray-800 rounded-t-xl border-b-0 relative z-10">
          <div className="grid grid-cols-2 md:flex md:flex-row flex-wrap lg:flex-nowrap items-start md:items-end gap-4 sm:gap-6 w-full">
            {/* Search */}
            <div className="col-span-2 md:flex-1 w-full border-b border-slate-300 dark:border-zinc-700 pb-1.5">
              <label className="block text-[10px] font-medium text-slate-500 mb-1">&nbsp;</label>
              <div className="flex items-center">
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search player/cou..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
                />
              </div>
            </div>
            
            {/* Level */}
            <div className="col-span-1 md:flex-1 w-full border-b border-slate-300 dark:border-zinc-700 pb-1.5">
              <CustomSelect
                label="Level"
                value={levelFilter}
                onChange={setLevelFilter}
                options={LEVEL_OPTIONS}
              />
            </div>

            {/* Week */}
            <div className="col-span-1 md:flex-1 w-full border-b border-slate-300 dark:border-zinc-700 pb-1.5">
              <CustomSelect
                label="Week"
                value={timeFilter}
                onChange={setTimeFilter}
                options={weekOptions}
              />
            </div>

            {/* Per Page */}
            <div className="col-span-2 md:w-24 border-b border-slate-300 dark:border-zinc-700 pb-1.5">
              <CustomSelect
                label="Per page"
                value={pageSize}
                onChange={setPageSize}
                options={PAGE_SIZE_OPTIONS}
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader />
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            Belum ada data pemain.
          </div>
        ) : (
          <div className="w-full">
            {viewMode === "list" ? (
              <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-b-xl shadow-sm flex flex-col overflow-hidden">
                {/* TABLE VIEW */}
                <div className="flex-1 w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                        <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-16">Rank</th>
                        <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nama</th>
                        <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center hidden sm:table-cell">Turnamen</th>
                        <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center hidden sm:table-cell">Points</th>
                        <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Breakdown</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-gray-800/50">
                      {paginatedPlayers.map((p, i) => {
                        const rankIndex = (currentPage - 1) * pageSize + i;
                        return (
                        <tr key={p.id} className="transition-colors">
                          <td className="p-4 text-center">
                            <span className="text-lg font-extrabold text-slate-400">
                              {rankIndex < 3 ? MEDAL[rankIndex] : `${rankIndex + 1}`}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-100">{p.fullname}</h4>
                              {p.level && (
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getLevelBadgeClass(p.level)}`}>
                                  {p.level}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center hidden sm:table-cell">
                            <span className="text-xs font-semibold text-slate-600 dark:text-zinc-400">
                              {p.tournament_count}
                            </span>
                          </td>
                          <td className="p-4 text-center hidden sm:table-cell">
                            <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
                              {(p.ranking_points || 0).toLocaleString()}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => openBreakdown(p, rankIndex + 1)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-gray-800/60 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                              <BarChart3 className="w-3.5 h-3.5" />
                              Statistik
                            </button>
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* GRID VIEW */
              <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-b-xl shadow-sm p-6 relative z-0 border-t-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedPlayers.map((p, i) => {
                    const rankIndex = (currentPage - 1) * pageSize + i;
                    return (
                    <div key={p.id} className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm relative">
                      <div className="absolute top-4 left-4 text-xl font-extrabold text-slate-400">
                        {rankIndex < 3 ? MEDAL[rankIndex] : `#${rankIndex + 1}`}
                      </div>
                      <div className="mb-4"></div>
                      <h3 className="font-bold text-slate-900 dark:text-white mt-4 mb-2">{p.fullname}</h3>
                      {p.level && (
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-4 ${getLevelBadgeClass(p.level)}`}>
                          {p.level}
                        </span>
                      )}
                      <div className="mt-auto pt-4 w-full flex justify-between items-end">
                        <div className="text-left">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Turnamen</p>
                          <p className="text-xl font-extrabold text-slate-700 dark:text-white">{p.tournament_count}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-brand-500 dark:text-blue-500 uppercase tracking-widest mb-0.5">Points</p>
                          <p className="text-xl font-extrabold text-slate-900 dark:text-white">{(p.ranking_points || 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => openBreakdown(p, rankIndex + 1)}
                        className="mt-6 w-full py-2 bg-slate-100 text-slate-700 dark:bg-gray-800/60 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        Statistik
                      </button>
                    </div>
                    )})}
                </div>
              </div>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-6 border-t border-slate-200 dark:border-zinc-800 gap-4 w-full px-2">
                <div className="flex flex-col text-sm text-slate-500 dark:text-zinc-400">
                  <span>
                    Showing {filteredPlayers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredPlayers.length)} of {filteredPlayers.length} entries
                  </span>
                </div>
                
                <div className="flex items-center gap-6">
                  <span className="text-sm text-slate-600 dark:text-zinc-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 disabled:opacity-30 transition-colors"
                    >
                      <ChevronsLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-zinc-200 disabled:opacity-30 transition-colors"
                    >
                      <ChevronsRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <SponsorSection />
    </main>

      {/* ─── STATISTICS MODAL ─────────────────────────────────────── */}
      {selectedPlayer && mounted && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div ref={modalRef} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                {selectedPlayerRank !== null && (
                  <span className="w-8 h-8 shrink-0 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 flex items-center justify-center font-black text-sm border border-brand-200 dark:border-brand-800/50">
                    #{selectedPlayerRank}
                  </span>
                )}
                <h3 className="font-bold text-lg text-slate-800 dark:text-zinc-100">
                  {selectedPlayer.fullname}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareStats}
                  disabled={isSharing || loadingMatches}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:hover:bg-brand-900/50 transition-colors disabled:opacity-50"
                  title="Bagikan Statistik (Screenshot)"
                >
                  {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : shareSuccess ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  <span className="hidden sm:inline">{shareSuccess ? "Berhasil" : "Bagikan"}</span>
                </button>
                <button 
                  onClick={() => setSelectedPlayer(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-full text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
              {loadingMatches ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader />
                </div>
              ) : (() => {
                const totalMatches = playerMatches.length;
                let wins = 0;
                let losses = 0;

                playerMatches.forEach(match => {
                  if (isWin(match, playerTeamIds)) wins++;
                  else losses++;
                });

                const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

                return (
                  <div className="space-y-6">
                    {/* Hero Stat - Win Rate */}
                    <div className="bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-brand-900/20 dark:to-indigo-900/20 p-5 sm:p-6 rounded-2xl border border-brand-100 dark:border-brand-800/30">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400 mb-2">Win Rate</h4>
                      <div className="flex items-end gap-3">
                        <span className="text-5xl sm:text-6xl font-black text-brand-600 dark:text-brand-400 leading-none">{winRate}%</span>
                        <span className="text-sm text-slate-500 dark:text-zinc-400 pb-1">dari {totalMatches} pertandingan</span>
                      </div>
                      {/* Progress Bar */}
                      <div className="mt-4 h-2 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand-500 rounded-full transition-all duration-700"
                          style={{ width: `${winRate}%` }}
                        />
                      </div>
                    </div>

                    {/* W / L / Total / Poin Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                      <div className="flex flex-col items-center justify-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-3 sm:p-4 text-center">
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Poin</p>
                        <p className="text-lg sm:text-xl font-black text-amber-700 dark:text-amber-300">{selectedPlayer.ranking_points?.toLocaleString() || 0}</p>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-3 sm:p-4 text-center">
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">Menang</p>
                        <p className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-300">{wins}</p>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-2xl p-3 sm:p-4 text-center">
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-1">Kalah</p>
                        <p className="text-2xl sm:text-3xl font-black text-rose-700 dark:text-rose-300">{losses}</p>
                      </div>
                      <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl p-3 sm:p-4 text-center">
                        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400 mb-1">Total</p>
                        <p className="text-2xl sm:text-3xl font-black text-slate-700 dark:text-zinc-200">{totalMatches}</p>
                      </div>
                    </div>

                    {/* 10 Last Matches */}
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Riwayat 10 Pertandingan Terakhir</h4>
                      {totalMatches === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 p-4 rounded-xl text-center">
                          Belum ada riwayat pertandingan.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {playerMatches.map((match, idx) => {
                            const win = isWin(match, playerTeamIds);
                            const isMyTeam1 = playerTeamIds.includes(match.team1_id);
                            const myScore = isMyTeam1 ? match.score_team1 : match.score_team2;
                            const oppScore = isMyTeam1 ? match.score_team2 : match.score_team1;
                            const myTeamName = isMyTeam1 ? match.teams_team1?.name : match.teams_team2?.name;
                            const oppTeamName = isMyTeam1 ? match.teams_team2?.name : match.teams_team1?.name;
                            
                            const extractPartner = (teamName: string, playerName: string) => {
                              if (!teamName) return "-";
                              const parts = teamName.split(/&|\//).map(p => p.trim());
                              if (parts.length > 1) {
                                return parts.find(p => p.toLowerCase() !== playerName.toLowerCase()) || "-";
                              }
                              return teamName;
                            };
                            
                            const partnerName = extractPartner(myTeamName || "", selectedPlayer.fullname);

                            return (
                              <div
                                key={match.id}
                                className={`flex flex-col px-4 py-3 rounded-xl border ${
                                  win
                                    ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50"
                                    : "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800/50"
                                }`}
                              >
                                <div className="flex items-center gap-3 mb-2">
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                                    win
                                      ? "bg-emerald-200 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300"
                                      : "bg-rose-200 text-rose-700 dark:bg-rose-800 dark:text-rose-300"
                                  }`}>{idx + 1}</span>
                                  <span className={`text-xs font-bold ${win ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
                                    {win ? "MENANG" : "KALAH"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-200/50 dark:border-zinc-700/50 gap-2">
                                  <div className="flex-1 min-w-0 text-left">
                                    <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">Rekan</span>
                                    <span className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 truncate" title={partnerName}>{partnerName}</span>
                                  </div>
                                  <div className="shrink-0 text-center px-2">
                                    <span className="inline-flex items-center justify-center whitespace-nowrap text-sm font-extrabold text-slate-700 dark:text-zinc-200 tabular-nums bg-white dark:bg-zinc-800/50 px-2 py-1 rounded shadow-sm border border-slate-100 dark:border-zinc-700">
                                      {myScore} <span className="text-slate-400 mx-1">–</span> {oppScore}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0 text-right">
                                    <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-0.5">Lawan</span>
                                    <span className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 truncate" title={oppTeamName ? oppTeamName.replace(/\s*\/\s*/g, ' & ') : undefined}>{oppTeamName ? oppTeamName.replace(/\s*\/\s*/g, ' & ') : "-"}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-slate-50 dark:bg-gray-800/30 text-center">
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
}
