"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import Loader from "@/components/shared/Loader";
import SponsorSection from "@/components/users/SponsorSection";
import {
  UserCircle, Mail, Phone, MapPin, Calendar, Edit3, LogOut,
  Trophy, Star, ShieldCheck, Loader2, Gamepad2, Award, LineChart, Target, Crown, History
} from "lucide-react";

interface ProfileData {
  id: string;
  fullname: string | null;
  username: string | null;
  avatar_url: string | null;
  gender: string | null;
  level: string | null;
  ranking_points: number;
  ranking_position: number | null;
  is_active: boolean;
  joined_at: string | null;
  address: string | null;
  height: number | null;
  hand_dominance: string | null;
  birth_date: string | null;
  user_id: string | null;
}

interface UserData {
  email: string | null;
  role: string;
}

interface TournamentData {
  id: string;
  name: string;
  start_date: string;
  status: string;
}

interface Participation {
  id: string;
  status: string;
  tournaments: TournamentData | null;
}

interface MatchData {
  id: string;
  team1_id: string;
  team2_id: string;
  score_team1: number | null;
  score_team2: number | null;
  created_at: string;
  tournaments: { name: string } | null;
  teams_team1?: { name: string } | null;
  teams_team2?: { name: string } | null;
}

export default function UserProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  
  // Extended Stats
  const [teamName, setTeamName] = useState<string>("Belum ada tim");
  const [totalMatches, setTotalMatches] = useState<number>(0);
  const [winRate, setWinRate] = useState<number>(0);
  const [participations, setParticipations] = useState<Participation[]>([]);
  
  // Modal Batalkan Turnamen
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [partToCancel, setPartToCancel] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [userTeamIds, setUserTeamIds] = useState<string[]>([]);
  const [recentMatches, setRecentMatches] = useState<MatchData[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      // Cek sesi auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // 1. Ambil data profile
      const { data: profileData } = await supabase
        .from("profile")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // 2. Ambil data users (email, role)
      const { data: usersData } = await supabase
        .from("users")
        .select("email, role")
        .eq("id", user.id)
        .single();

      if (profileData) {
        // 3. Ambil data Tim & Pertandingan menggunakan logika seperti di halaman Rankings
        const { data: histData } = await supabase
          .from("point_histories")
          .select("tournament_id")
          .eq("player_id", profileData.id);

        const tournamentIds = [...new Set((histData || []).map((h: any) => h.tournament_id).filter(Boolean))];

        if (tournamentIds.length === 0) {
          // Fallback: try directly from tournament_participants
          const { data: tpData } = await supabase
            .from("tournament_participants")
            .select("tournament_id")
            .eq("profile_id", profileData.id);
          
          const tIds = [...new Set((tpData || []).map((t: any) => t.tournament_id).filter(Boolean))];
          if (tIds.length > 0) {
            tournamentIds.push(...tIds);
          }
        }

        let firstTeamName = "";
        const allTeamIds: string[] = [];
        for (const tId of tournamentIds) {
          const { data: teamsData } = await supabase
            .from("teams")
            .select("id, name")
            .eq("tournament_id", tId)
            .or(`player1_id.eq.${profileData.id},player2_id.eq.${profileData.id}`);
          
          if (teamsData && teamsData.length > 0) {
            allTeamIds.push(...teamsData.map((t: any) => t.id));
            if (!firstTeamName) firstTeamName = teamsData[0].name;
          }
        }
        
        setUserTeamIds(allTeamIds);
        if (firstTeamName) setTeamName(firstTeamName);

        // 4. Hitung Statistik Pertandingan
        if (allTeamIds.length > 0) {
          const { data: matchesData } = await supabase
            .from("matches")
            .select("id, team1_id, team2_id, score_team1, score_team2, created_at, tournaments(name), teams_team1:teams!team1_id(name), teams_team2:teams!team2_id(name)")
            .or(`team1_id.in.(${allTeamIds.join(',')}),team2_id.in.(${allTeamIds.join(',')})`)
            .eq("status", "completed")
            .order("created_at", { ascending: false });

          if (matchesData && matchesData.length > 0) {
            setTotalMatches(matchesData.length);
            const wonMatches = matchesData.filter(m => {
              const isTeam1 = allTeamIds.includes(m.team1_id);
              const isTeam2 = allTeamIds.includes(m.team2_id);
              if (isTeam1 && (m.score_team1 || 0) > (m.score_team2 || 0)) return true;
              if (isTeam2 && (m.score_team2 || 0) > (m.score_team1 || 0)) return true;
              return false;
            }).length;
            
            setWinRate(Number(((wonMatches / matchesData.length) * 100).toFixed(1)));
            setRecentMatches(matchesData.slice(0, 10) as any);
          } else {
            setTotalMatches(0);
            setWinRate(0);
            setRecentMatches([]);
          }
        } else {
          setTotalMatches(0);
          setWinRate(0);
          setRecentMatches([]);
        }

        // 5. Ambil data turnamen yang diikuti (untuk list partisipasi)
        const { data: partsData } = await supabase
          .from("tournament_participants")
          .select(`
            id, status,
            tournaments ( id, name, start_date, status )
          `)
          .eq("profile_id", profileData.id);
          
        if (partsData) {
          setParticipations(partsData as unknown as Participation[]);
        }
      }

      setProfile(profileData as ProfileData);
      setUserData(usersData as UserData ?? { email: user.email ?? null, role: "user" });
      setLoading(false);
    }
    fetchProfile();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function handleCancelTournament(id: string) {
    setPartToCancel(id);
    setCancelModalOpen(true);
  }

  async function confirmCancelTournament() {
    if (!partToCancel) return;
    setIsCanceling(true);

    try {
      const res = await fetch("/api/user/cancel-registration", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant_id: partToCancel }),
      });
      const json = await res.json();
      
      if (!res.ok) {
        toast.error(json.error || "Gagal membatalkan partisipasi.");
      } else {
        toast.success("Partisipasi berhasil dibatalkan.");
        setParticipations(prev => prev.filter(p => p.id !== partToCancel));
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setIsCanceling(false);
      setCancelModalOpen(false);
      setPartToCancel(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  const displayName = profile?.fullname || userData?.email?.split("@")[0] || "Pengguna";
  const initials = displayName.charAt(0).toUpperCase();

  // Evaluasi Teks Sub-Stats berdasarkan performa
  const winRateText = winRate > 65 ? "SANGAT TANGGUH" : winRate > 45 ? "CUKUP BAIK" : "PERLU LATIHAN";
  const matchText = totalMatches > 20 ? "JAM TERBANG TINGGI" : "PEMAIN BARU";
  const levelText = profile?.level === "utama" ? "MYTHICAL GLORY" : "EPIC/LEGEND";

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-6 pb-10 pt-28 px-4 md:px-8">
        
        {/* Header Kecil dengan Logout */}
      <div className="flex justify-between items-center bg-transparent">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Profile</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
        >
          <LogOut className="h-4 w-4" />
          Keluar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* === KOLOM KIRI (Profil Utama) === */}
        <div className="h-fit lg:col-span-1 rounded-2xl bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800/60 p-8 flex flex-col items-center text-center shadow-sm relative overflow-hidden group">
          
          {/* Efek Glow di background */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-orange-500/10 blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full pointer-events-none"></div>

          {/* Avatar Area */}
          <div className="relative mb-5 mt-2">
            <div className="h-28 w-28 rounded-full overflow-hidden bg-gradient-to-tr from-amber-500 to-orange-400 p-[3px] shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <div className="h-full w-full rounded-full bg-[#18181b] flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={displayName}
                    width={112}
                    height={112}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-400 to-orange-500">{initials}</span>
                )}
              </div>
            </div>
            {/* Rank overlay */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full px-3 py-0.5 border-2 border-white dark:border-gray-800 shadow-md">
              <span className="text-[11px] font-black text-white whitespace-nowrap tracking-wider">
                {profile?.ranking_position ? `#${profile.ranking_position}` : (profile?.level?.toUpperCase() || "NEWBIE")}
              </span>
            </div>
          </div>

          {/* Nama & Info */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-wide">{displayName}</h2>
          <p className="text-sm font-medium text-amber-500 mb-8 tracking-wider">
            {profile?.username ? `@${profile.username}` : "-"}
          </p>
          {/* Tombol Edit */}
          <Link
            href="/user/profile/edit"
            className="mt-4 w-4/5 h-10 rounded-full border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white dark:hover:text-black transition-all flex items-center justify-center gap-2 group/edit"
          >
            <Edit3 className="w-4 h-4 group-hover/edit:text-black" /> Edit Profile
          </Link>
        </div>

        {/* === KOLOM KANAN === */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STATISTIK ATAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Points */}
            <div className="rounded-xl bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800/60 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-widest uppercase">Level Points</p>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
                  {(profile?.ranking_points ?? 0).toLocaleString()} <span className="text-lg font-bold text-amber-500">PTS</span>
                </p>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{levelText}</p>
              </div>
            </div>

            {/* Card 2: Matches */}
            <div className="rounded-xl bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800/60 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-widest uppercase">Matches Main</p>
                <LineChart className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
                  {totalMatches} <span className="text-lg font-bold text-gray-400">Match</span>
                </p>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{matchText}</p>
              </div>
            </div>

            {/* Card 3: Win Rate */}
            <div className="rounded-xl bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800/60 p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-widest uppercase">Tingkat Win Rate</p>
                <Target className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">
                  {winRate}<span className="text-lg font-bold text-emerald-500">%</span>
                </p>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{winRateText}</p>
              </div>
            </div>

          </div>

          {/* DAFTAR TURNAMEN */}
          <div className="rounded-2xl bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800/60 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-gray-800/50 pb-4">
              <Gamepad2 className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-wide">
                Turnamen Yang Diikuti ({participations.length})
              </h3>
            </div>

            <div className="space-y-4">
              {participations.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  Anda belum mengikuti turnamen apapun.
                </div>
              ) : (
                participations.map((part) => {
                  const tour = part.tournaments;
                  if (!tour) return null;
                  return (
                    <div key={part.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors gap-4">
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm md:text-base">{tour.name}</h4>
                        <p className="text-[11px] font-medium text-gray-500 mt-1 tracking-wider uppercase">
                          OLAHRAGA: BULUTANGKIS • MULAI: {tour.start_date}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        {part.status === "confirmed" && (
                          <span className="px-3 py-1 text-[10px] font-bold tracking-widest text-emerald-500 border border-emerald-500/30 bg-emerald-500/10 rounded-md">
                            TERKONFIRMASI
                          </span>
                        )}
                        {part.status === "pending" && (
                          <span className="px-3 py-1 text-[10px] font-bold tracking-widest text-yellow-600 border border-yellow-500/30 bg-yellow-500/10 rounded-md">
                            MENUNGGU KONFIRMASI
                          </span>
                        )}
                        {(part.status === "withdrawn" || part.status === "disqualified") && (
                          <span className="px-3 py-1 text-[10px] font-bold tracking-widest text-rose-500 border border-rose-500/30 bg-rose-500/10 rounded-md">
                            {part.status === "withdrawn" ? "DIBATALKAN" : "DIDISKUALIFIKASI"}
                          </span>
                        )}
                        
                        {part.status === "pending" && tour.status !== 'completed' && tour.status !== 'ongoing' && (
                          <button
                            onClick={() => handleCancelTournament(part.id)}
                            className="px-3 py-1 text-[10px] font-bold tracking-widest text-rose-500 border border-rose-500/30 hover:bg-rose-500/10 rounded-md transition-colors"
                          >
                            BATALKAN
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* DAFTAR PERTANDINGAN */}
          <div className="rounded-2xl bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800/60 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-gray-800/50 pb-4">
              <History className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-wide">
                Riwayat Pertandingan (Terakhir {recentMatches.length})
              </h3>
            </div>

            <div className="space-y-4">
              {recentMatches.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  Belum ada riwayat pertandingan.
                </div>
              ) : (
                recentMatches.map((m) => {
                  const myTeamIsT1 = userTeamIds.includes(m.team1_id);
                  const myScore = myTeamIsT1 ? m.score_team1 : m.score_team2;
                  const opScore = myTeamIsT1 ? m.score_team2 : m.score_team1;
                  const isWin = (myScore || 0) > (opScore || 0);
                  const isDraw = (myScore || 0) === (opScore || 0);
                  const resultText = isWin ? "MENANG" : isDraw ? "SERI" : "KALAH";
                  const resultColor = isWin ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" : isDraw ? "text-gray-500 bg-gray-500/10 border-gray-500/30" : "text-rose-500 bg-rose-500/10 border-rose-500/30";

                  const myTeamName = myTeamIsT1 ? m.teams_team1?.name : m.teams_team2?.name;
                  const oppTeamName = myTeamIsT1 ? m.teams_team2?.name : m.teams_team1?.name;
                  
                  const extractPartner = (teamName: string, playerName: string) => {
                    if (!teamName) return "-";
                    const parts = teamName.split(/&|\//).map(p => p.trim());
                    if (parts.length > 1) {
                      return parts.find(p => p.toLowerCase() !== playerName.toLowerCase()) || "-";
                    }
                    return teamName;
                  };
                  const partnerName = extractPartner(myTeamName || "", profile?.fullname || "");

                  return (
                    <div key={m.id} className="flex flex-col p-4 rounded-xl border border-gray-200 dark:border-gray-800/60 bg-gray-50 dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors gap-3">
                      
                      {/* Header: Tournament & Result Badge */}
                      <div className="flex items-center justify-between gap-4">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm md:text-base truncate">
                          {m.tournaments?.name || "Pertandingan Persahabatan"}
                        </h4>
                        <span className={`px-2.5 py-1 text-[9px] sm:text-[10px] font-bold tracking-widest border rounded-md shrink-0 ${resultColor}`}>
                          {resultText}
                        </span>
                      </div>
                      
                      {/* Match Details: Nama - Skor - Nama */}
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 my-2">
                        {/* Team 1 (My Team) */}
                        <div className="text-right flex flex-col items-end">
                           <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Tim Anda</span>
                           <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-sm line-clamp-2">
                             {myTeamName ? myTeamName.replace(/\s*\/\s*/g, ' & ') : "-"}
                           </span>
                        </div>
                        
                        {/* Score */}
                        <div className="flex items-center justify-center gap-1.5 sm:gap-3 font-black text-lg sm:text-2xl text-gray-900 dark:text-white px-3 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
                          <span className={isWin ? "text-emerald-500" : ""}>{myScore || 0}</span>
                          <span className="text-gray-300 dark:text-gray-600 font-light">-</span>
                          <span className={!isWin && !isDraw ? "text-rose-500" : ""}>{opScore || 0}</span>
                        </div>

                        {/* Team 2 (Opponent) */}
                        <div className="text-left flex flex-col items-start">
                           <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-400 mb-0.5">Lawan</span>
                           <span className="text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm line-clamp-2">
                             {oppTeamName ? oppTeamName.replace(/\s*\/\s*/g, ' & ') : "-"}
                           </span>
                        </div>
                      </div>

                      {/* Footer: Date */}
                      <p className="text-[9px] sm:text-[10px] font-medium text-gray-400 tracking-wider uppercase text-center sm:text-left">
                        TANGGAL: {new Date(m.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
    <SponsorSection />

    {/* MODAL BATALKAN TURNAMEN */}
    {cancelModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Batalkan Pendaftaran</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Apakah Anda yakin ingin membatalkan pendaftaran turnamen ini? Tindakan ini tidak dapat diurungkan.</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setCancelModalOpen(false); setPartToCancel(null); }}
              className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              disabled={isCanceling}
            >
              Tutup
            </button>
            <button
              onClick={confirmCancelTournament}
              className="px-4 py-2 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
              disabled={isCanceling}
            >
              {isCanceling ? "Membatalkan..." : "Ya, Batalkan"}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
