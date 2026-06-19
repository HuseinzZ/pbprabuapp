"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Loader from "@/components/shared/Loader";
import { useRouter } from "next/navigation";

type Tournament = {
  id: string;
  name: string;
  status: "upcoming" | "ongoing" | "completed";
  location: string;
  start_date: string;
  registration_deadline: string | null;
  max_participants: number;
  prize_pool: number;
  points: { name: string } | null;
};

type Match = {
  id: string;
  match_date: string;
  team1_player1: string;
  team1_player2: string;
  team2_player1: string;
  team2_player2: string;
  team1_score: number;
  team2_score: number;
  status: string;
};

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTournament, setExpandedTournament] = useState<string | null>(null);
  const [tournamentMatches, setTournamentMatches] = useState<{ [key: string]: Match[] }>({});
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      // Check auth
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      // Fetch tournaments
      const { data } = await supabase
        .from("tournaments")
        .select("*, points(name)")
        .order("start_date", { ascending: false });
      
      setTournaments(data || []);
      setLoading(false);
    }
    init();
  }, [supabase]);

  const handleRegister = () => {
    if (isLoggedIn) {
      router.push("/user/tournaments");
    } else {
      router.push("/auth/login?redirect=/user/tournaments");
    }
  };

  const toggleBracket = async (tId: string) => {
    if (expandedTournament === tId) {
      setExpandedTournament(null);
      return;
    }
    setExpandedTournament(tId);
    if (!tournamentMatches[tId]) {
      setLoadingMatches(true);
      const { data } = await supabase
        .from("matches")
        .select("*")
        .eq("tournament_id", tId)
        .order("match_date", { ascending: true });
      setTournamentMatches(prev => ({ ...prev, [tId]: data || [] }));
      setLoadingMatches(false);
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  return (
    <div className="pt-24 pb-12 px-4 md:px-8 xl:px-16 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Turnamen PB Prabu</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Daftar turnamen badminton, jadwal, dan hasil pertandingan
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full"><Loader /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tournaments.map((t) => (
            <div key={t.id} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full text-xs font-semibold mb-2">
                      {t.points?.name || "Umum"}
                    </span>
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white leading-tight">{t.name}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    t.status === 'upcoming' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                    t.status === 'ongoing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }`}>
                    {t.status === 'upcoming' ? 'Akan Datang' : t.status === 'ongoing' ? 'Berlangsung' : 'Selesai'}
                  </span>
                </div>

                <div className="flex flex-col gap-2 text-sm text-gray-500 mb-6">
                  <span className="flex items-center gap-2">
                    <span>📅</span> {new Date(t.start_date).toLocaleDateString("id-ID")}
                  </span>
                  <p className="flex items-center gap-2">
                    <span>📍</span> {t.location || "Lokasi belum ditentukan"}
                  </p>
                  <p className="flex items-center gap-2">
                    <span>👥</span> Maks {t.max_participants || "-"} Peserta
                  </p>
                  <p className="flex items-center gap-2">
                    <span>🏆</span> Hadiah: {t.prize_pool ? formatRupiah(t.prize_pool) : "-"}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                {t.status === "upcoming" ? (
                  <button
                    onClick={handleRegister}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-semibold transition"
                  >
                    Daftar Sekarang
                  </button>
                ) : t.status === "completed" ? (
                  <button
                    onClick={() => toggleBracket(t.id)}
                    className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg text-sm font-semibold transition"
                  >
                    {expandedTournament === t.id ? "Tutup Hasil" : "Lihat Hasil & Bracket"}
                  </button>
                ) : (
                  <span className="w-full text-center text-gray-500 py-2.5 text-sm font-medium">Turnamen sedang berlangsung</span>
                )}
              </div>

              {expandedTournament === t.id && (
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                  <h4 className="font-bold mb-4 text-gray-900 dark:text-white">Hasil Pertandingan</h4>
                  {loadingMatches ? (
                    <p className="text-sm text-gray-500">Memuat bracket...</p>
                  ) : tournamentMatches[t.id]?.length > 0 ? (
                    <div className="space-y-3">
                      {tournamentMatches[t.id].map((match, i) => (
                        <div key={match.id} className="p-3 border border-gray-100 dark:border-gray-800 rounded-lg flex justify-between items-center bg-gray-50 dark:bg-gray-800/30 text-sm">
                          <div className="flex-1">
                            <span className={match.team1_score > match.team2_score ? "font-bold text-gray-900 dark:text-white" : "text-gray-500"}>Tim 1</span>
                          </div>
                          <div className="px-4 font-bold text-indigo-600 dark:text-indigo-400">
                            {match.team1_score} - {match.team2_score}
                          </div>
                          <div className="flex-1 text-right">
                            <span className={match.team2_score > match.team1_score ? "font-bold text-gray-900 dark:text-white" : "text-gray-500"}>Tim 2</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Data pertandingan belum tersedia.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
