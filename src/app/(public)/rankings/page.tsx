"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Loader from "@/components/shared/Loader";

type Player = {
  id: string;
  fullname: string;
  username: string;
  level: string;
  ranking_points: number;
  avatar_url: string;
};

type Match = {
  id: string;
  tournament_id: string;
  match_date: string;
  team1_player1: string;
  team1_player2: string;
  team2_player1: string;
  team2_player2: string;
  team1_score: number;
  team2_score: number;
  status: string;
};

export default function RankingsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [playerMatches, setPlayerMatches] = useState<{ [key: string]: Match[] }>({});
  const [loadingMatches, setLoadingMatches] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function fetchPlayers() {
      const { data } = await supabase
        .from("profile")
        .select("id, fullname, username, level, ranking_points, avatar_url")
        .eq("is_active", true)
        .order("ranking_points", { ascending: false });
      
      setPlayers(data || []);
      setLoading(false);
    }
    fetchPlayers();
  }, [supabase]);

  const toggleExpand = async (playerId: string) => {
    if (expandedPlayer === playerId) {
      setExpandedPlayer(null);
      return;
    }
    
    setExpandedPlayer(playerId);
    if (!playerMatches[playerId]) {
      setLoadingMatches(true);
      const { data } = await supabase
        .from("matches")
        .select("*")
        .or(`team1_player1.eq.${playerId},team1_player2.eq.${playerId},team2_player1.eq.${playerId},team2_player2.eq.${playerId}`)
        .eq("status", "completed")
        .order("match_date", { ascending: false })
        .limit(5);
        
      setPlayerMatches(prev => ({ ...prev, [playerId]: data || [] }));
      setLoadingMatches(false);
    }
  };

  const isWin = (match: Match, playerId: string) => {
    const isTeam1 = match.team1_player1 === playerId || match.team1_player2 === playerId;
    if (isTeam1) {
      return match.team1_score > match.team2_score;
    } else {
      return match.team2_score > match.team1_score;
    }
  };

  return (
    <div className="pt-24 pb-12 px-4 md:px-8 xl:px-16 max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Ranking poin terbaru pemain PB Prabu Bandung
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              viewMode === "list" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              viewMode === "grid" ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full"><Loader /></div>
      ) : (
        <>
          {viewMode === "list" ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400">Rank</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400">Pemain</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400">Level</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-right">Poin</th>
                    <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-center">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {players.map((p, i) => (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">#{i + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center font-bold">
                              {p.fullname.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{p.fullname}</p>
                              {p.username && <p className="text-xs text-gray-500">"{p.username}"</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                          <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-md text-xs">{p.level || "-"}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-indigo-600 dark:text-indigo-400">
                          {p.ranking_points}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => toggleExpand(p.id)}
                            className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:underline"
                          >
                            {expandedPlayer === p.id ? "Tutup" : "Lihat Statistik"}
                          </button>
                        </td>
                      </tr>
                      {expandedPlayer === p.id && (
                        <tr>
                          <td colSpan={5} className="bg-gray-50 dark:bg-gray-800/30 p-6 border-b border-gray-100 dark:border-gray-800">
                            <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">5 Pertandingan Terakhir</h4>
                            {loadingMatches ? (
                              <p className="text-sm text-gray-500">Memuat data...</p>
                            ) : playerMatches[p.id]?.length > 0 ? (
                              <div className="flex gap-2 flex-wrap">
                                {playerMatches[p.id].map(match => {
                                  const win = isWin(match, p.id);
                                  return (
                                    <div key={match.id} className={`px-3 py-2 rounded border text-xs font-medium ${
                                      win 
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400" 
                                        : "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400"
                                    }`}>
                                      {win ? "Menang" : "Kalah"} ({match.team1_score} - {match.team2_score})
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">Belum ada riwayat pertandingan.</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {players.map((p, i) => (
                <div key={p.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 relative flex flex-col items-center text-center shadow-sm hover:shadow-md transition">
                  <div className="absolute top-4 left-4 font-bold text-gray-300 dark:text-gray-700 text-xl">#{i + 1}</div>
                  <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 text-2xl flex items-center justify-center font-bold mb-4">
                    {p.fullname.charAt(0)}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{p.fullname}</h3>
                  {p.username && <p className="text-sm text-gray-500 dark:text-gray-400">"{p.username}"</p>}
                  <div className="mt-4 mb-6">
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300">
                      Level: {p.level || "-"}
                    </span>
                  </div>
                  <div className="mt-auto">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Poin</p>
                    <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{p.ranking_points}</p>
                  </div>
                  
                  <button
                    onClick={() => toggleExpand(p.id)}
                    className="mt-6 text-sm text-indigo-600 dark:text-indigo-400 font-semibold"
                  >
                    {expandedPlayer === p.id ? "Tutup Statistik" : "Lihat Statistik"}
                  </button>

                  {expandedPlayer === p.id && (
                    <div className="mt-4 w-full pt-4 border-t border-gray-100 dark:border-gray-800 text-left">
                      <h4 className="font-semibold mb-2 text-xs text-gray-900 dark:text-white">5 Laga Terakhir:</h4>
                      {loadingMatches ? (
                        <p className="text-xs text-gray-500">Memuat...</p>
                      ) : playerMatches[p.id]?.length > 0 ? (
                        <div className="flex gap-1 flex-wrap justify-center">
                          {playerMatches[p.id].map(match => {
                            const win = isWin(match, p.id);
                            return (
                              <div key={match.id} className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold ${
                                win 
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                              }`} title={`${win ? "Menang" : "Kalah"} ${match.team1_score}-${match.team2_score}`}>
                                {win ? "W" : "L"}
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 text-center">Belum ada riwayat.</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
