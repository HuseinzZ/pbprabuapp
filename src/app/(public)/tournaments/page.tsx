"use client";
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { X, Info, Trophy, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import SponsorSection from "@/components/users/SponsorSection";
import Loader from "@/components/shared/Loader";

type TournamentStatus = "all" | "upcoming" | "registration" | "ongoing" | "completed";

type Tournament = {
  id: string;
  name: string;
  status: "upcoming" | "registration" | "ongoing" | "completed";
  location: string;
  start_date: string;
  registration_deadline: string | null;
  max_participants: number;
  prize_pool: number;
  entry_fee: number;
  rules: string | null;
  match_format: string | null;
  gender_category?: string | null;
  points: { name: string } | null;
  tournament_participants?: { id: string }[];
};

const FILTERS: { key: TournamentStatus; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "upcoming", label: "Akan Datang" },
  { key: "registration", label: "Pendaftaran" },
  { key: "ongoing", label: "Berlangsung" },
  { key: "completed", label: "Selesai" },
];

const STATUS_LABEL: Record<string, string> = {
  upcoming: "Akan Datang",
  registration: "Pendaftaran",
  ongoing: "Berlangsung",
  completed: "Selesai",
};

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  registration: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  ongoing: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  completed: "bg-slate-100 text-slate-500 dark:bg-gray-800 dark:text-gray-400",
};

const RANK_LABELS: Record<string, string> = {
  F: "Juara 1", SF: "Juara 2", QF: "Semifinal",
  R16: "Top 16", R32: "Top 32", RR: "Round Robin",
};

function getRankMedal(idx: number) {
  if (idx === 0) return "🥇";
  if (idx === 1) return "🥈";
  if (idx === 2) return "🥉";
  return null;
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

const PAGE_SIZE = 10;

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TournamentStatus>("all");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Modal State
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [modalParticipants, setModalParticipants] = useState<any[]>([]);
  const [tournamentRankings, setTournamentRankings] = useState<any[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      const { data, error } = await supabase
        .from("tournaments")
        .select("*, points(name), tournament_participants(id)")
        .order("start_date", { ascending: false });
      if (error) toast.error("Gagal memuat data turnamen.");
      setTournaments((data as any) || []);
      setLoading(false);
    }
    init();
  }, []);

  const handleRegister = () => {
    if (isLoggedIn) router.push("/user/tournaments");
    else router.push("/auth/login?redirect=/user/tournaments");
  };

  const openTournamentModal = async (t: Tournament) => {
    setSelectedTournament(t);
    setCurrentPage(1);
    setLoadingModal(true);
    setModalParticipants([]);
    setTournamentRankings([]);

    // Fetch participants with profiles via profile_id FK
    const { data: pData, error: pErr } = await supabase
      .from("tournament_participants")
      .select("id, status, profile_id, profile:profile_id(fullname, avatar_url)")
      .eq("tournament_id", t.id);
    console.log("[Modal] participants:", pData, pErr);
    setModalParticipants(pData || []);

    // Fetch rankings from point_histories for completed tournaments
    if (t.status === "completed") {
      const { data: rankData, error: rankErr } = await supabase
        .from("point_histories")
        .select("player_id, phase_achieved, points_earned, profile:player_id(fullname, avatar_url)")
        .eq("tournament_id", t.id)
        .order("points_earned", { ascending: false });
      console.log("[Modal] rankings:", rankData, rankErr);
      setTournamentRankings(rankData || []);
    }

    setLoadingModal(false);
  };

  const filtered = activeFilter === "all"
    ? tournaments
    : tournaments.filter((t) => t.status === activeFilter);

  // Modal JSX – will be portaled to document.body
  const modalContent = selectedTournament ? (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
      }}
    >
      {/* Backdrop */}
      <div
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
        onClick={() => setSelectedTournament(null)}
      />
      {/* Panel */}
      <div className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">{selectedTournament.name}</h2>
            <span className="inline-flex items-center px-2.5 py-1 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 text-[10px] font-bold uppercase tracking-widest rounded">
              {selectedTournament.points?.name || "UMUM"}
            </span>
          </div>
          <button onClick={() => setSelectedTournament(null)} className="ml-4 p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors shrink-0">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {loadingModal ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader />
            </div>
          ) : (
            <>
              {/* Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
                <div>
                  <div className="text-[10px] text-slate-400 dark:text-gray-500 font-mono font-bold uppercase tracking-widest mb-1.5">HADIAH POOL</div>
                  <div className="text-base font-bold text-brand-500">{formatRupiah(selectedTournament.prize_pool)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 dark:text-gray-500 font-mono font-bold uppercase tracking-widest mb-1.5">BIAYA DAFTAR</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">{selectedTournament.entry_fee > 0 ? formatRupiah(selectedTournament.entry_fee) : "Gratis"}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 dark:text-gray-500 font-mono font-bold uppercase tracking-widest mb-1.5">TANGGAL MULAI</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{new Date(selectedTournament.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 dark:text-gray-500 font-mono font-bold uppercase tracking-widest mb-1.5">LIMIT PEMAIN</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{selectedTournament.max_participants > 0 ? `${selectedTournament.max_participants} Slots` : "Tanpa Limit"}</div>
                </div>
                <div className="col-span-2 md:col-span-4 border-t border-gray-100 dark:border-gray-800 pt-3 mt-1">
                  <div className="text-[10px] text-slate-400 dark:text-gray-500 font-mono font-bold uppercase tracking-widest mb-1.5">FORMAT MATCH</div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {[selectedTournament.match_format, selectedTournament.gender_category].filter(Boolean).join(" - ") || "Sistem Gugur"}
                  </div>
                </div>
              </div>

              {/* Rules */}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-brand-500" /> Aturan &amp; Syarat Turnamen
                </h3>
                <div className="bg-slate-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 p-5 text-sm text-slate-600 dark:text-gray-400 leading-relaxed">
                  {selectedTournament.rules
                    ? <div dangerouslySetInnerHTML={{ __html: selectedTournament.rules }} />
                    : <p>Belum ada aturan spesifik yang ditetapkan untuk turnamen ini.</p>}
                </div>
              </div>

              {/* Registered Players */}
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Pemain Terdaftar ({modalParticipants.length})
                </h3>
                {modalParticipants.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {modalParticipants.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((p, idx) => (
                        <div key={p.id || idx} className="px-3 py-2 bg-slate-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg text-sm font-medium text-slate-800 dark:text-gray-200 flex items-center gap-2">
                          {p.profile?.avatar_url
                            ? <img src={p.profile.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                            : <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-slate-500">{(p.profile?.fullname || "?")[0].toUpperCase()}</div>}
                          {p.profile?.fullname || `Pemain #${(currentPage - 1) * PAGE_SIZE + idx + 1}`}
                        </div>
                      ))}
                    </div>
                    {Math.ceil(modalParticipants.length / PAGE_SIZE) > 1 && (
                      <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                        <span className="text-xs text-slate-500">Halaman {currentPage} dari {Math.ceil(modalParticipants.length / PAGE_SIZE)}</span>
                        <div className="flex gap-1">
                          <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"><ChevronsLeft className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"><ChevronLeft className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(modalParticipants.length / PAGE_SIZE), p + 1))} disabled={currentPage === Math.ceil(modalParticipants.length / PAGE_SIZE)} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"><ChevronRight className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setCurrentPage(Math.ceil(modalParticipants.length / PAGE_SIZE))} disabled={currentPage === Math.ceil(modalParticipants.length / PAGE_SIZE)} className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"><ChevronsRight className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 p-4">Belum ada peserta yang mendaftar.</p>
                )}
              </div>

              {/* Tournament Results from point_histories */}
              {selectedTournament.status === "completed" && (
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                    <Trophy className="w-4 h-4 text-brand-500" /> Hasil Turnamen
                  </h3>
                  {tournamentRankings.length > 0 ? (
                    <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                            <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-12">#</th>
                            <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pemain</th>
                            <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Posisi</th>
                            <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Poin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {tournamentRankings.map((r, idx) => {
                            const medal = getRankMedal(idx);
                            const label = RANK_LABELS[r.phase_achieved] || r.phase_achieved || "Peserta";
                            return (
                              <tr key={`${r.player_id}-${idx}`} className="bg-white dark:bg-gray-900 hover:bg-slate-50 dark:hover:bg-gray-800/40 transition-colors">
                                <td className="px-4 py-3 text-center">
                                  {medal ? <span className="text-lg">{medal}</span> : <span className="text-xs font-bold text-slate-500">{idx + 1}</span>}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    {r.profile?.avatar_url
                                      ? <img src={r.profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                                      : <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-slate-500">{(r.profile?.fullname || "?")[0].toUpperCase()}</div>}
                                    <span className="font-semibold text-slate-900 dark:text-white">{r.profile?.fullname || "Unknown"}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded text-xs font-bold">{label}</span>
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-brand-500 tabular-nums">{r.points_earned} pts</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 p-4">Data hasil turnamen belum tersedia.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-end shrink-0">
          <button onClick={() => setSelectedTournament(null)} className="px-6 py-2.5 rounded-lg bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-white text-sm font-bold hover:bg-slate-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors">
            Tutup
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="pt-24 md:pt-32 pb-16 px-4 md:px-8 xl:px-16 max-w-[1440px] mx-auto min-h-screen page-fade-in">
        {/* Header */}
        <div className="mb-12 max-w-3xl mx-auto text-center">
          {/* <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 text-[10px] font-bold uppercase tracking-widest mb-4">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Portal PB Prabu
          </div> */}
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">Turnamen</h1>
          <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">Daftar turnamen badminton, jadwal, dan rekap hasil pertandingan</p>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 ${
                activeFilter === f.key
                  ? "bg-zinc-950 text-white dark:bg-white dark:text-slate-900 shadow-md"
                  : "bg-white text-slate-700 dark:bg-gray-800/40 dark:text-gray-400 hover:bg-slate-50 hover:text-slate-900 dark:hover:text-white shadow-sm border border-slate-200 dark:border-gray-800"
              }`}
              aria-pressed={activeFilter === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border border-gray-200 dark:border-gray-800 rounded-2xl p-6 bg-white dark:bg-gray-800/40">
                <div className="skeleton h-3 w-24 rounded-full mb-4" />
                <div className="skeleton h-7 w-3/4 rounded mb-3" />
                <div className="space-y-2 mb-6">
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                </div>
                <div className="skeleton h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-slate-400 dark:text-zinc-500">
            Tidak ada turnamen {activeFilter !== "all" ? `dengan status "${STATUS_LABEL[activeFilter]}"` : ""}.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filtered.map((t) => {
              const registeredCount = t.tournament_participants ? t.tournament_participants.length : 0;
              const max = t.max_participants || 0;
              const remaining = max > 0 ? Math.max(0, max - registeredCount) : 0;
              const percentage = max > 0 ? Math.min(100, (registeredCount / max) * 100) : 100;

              return (
                <article
                  key={t.id}
                  className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col shadow-sm"
                >
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div className="text-xs font-mono font-bold text-brand-500 uppercase tracking-widest">
                        BIAYA PENDAFTARAN: {t.entry_fee > 0 ? formatRupiah(t.entry_fee) : "GRATIS"}
                      </div>
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-[10px] font-bold font-mono text-slate-700 dark:text-gray-300 uppercase tracking-widest shrink-0">
                        {t.points?.name || "UMUM"}
                      </span>
                    </div>

                    <div className="mb-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${STATUS_COLORS[t.status] || ""}`}>
                        {STATUS_LABEL[t.status] || t.status}
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-6">
                      {t.name}
                    </h2>

                    <div className="w-full h-px bg-slate-200 dark:bg-gray-800 mb-6"></div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div>
                        <div className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest mb-1.5">SISTEM FORMAT</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {[t.match_format, t.gender_category].filter(Boolean).join(" - ") || "Sistem Gugur"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest mb-1.5">MULAI TANGGAL</div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(t.start_date).toISOString().split("T")[0]}
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-xs font-mono font-bold mb-2">
                        <span className="text-slate-500">Pendaftaran:</span>
                        <span className="text-slate-900 dark:text-white">
                          {max > 0
                            ? <>{registeredCount} / {max} <span className="text-slate-400 dark:text-zinc-500 font-normal">({remaining} tersisa)</span></>
                            : <>{registeredCount} Terdaftar</>}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-0 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => openTournamentModal(t)}
                      className="flex-1 py-3 px-4 rounded-lg bg-slate-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-xs font-bold text-slate-700 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-widest text-center"
                    >
                      LIHAT DETAIL & ATURAN
                    </button>
                    {t.status === "completed" ? (
                      <button disabled className="flex-1 py-3 px-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest text-center flex justify-center items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        TURNAMEN SELESAI
                      </button>
                    ) : t.status === "ongoing" ? (
                      <button disabled className="flex-1 py-3 px-4 rounded-lg bg-slate-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-800 text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">
                        SEDANG BERLANGSUNG
                      </button>
                    ) : (t.status === "upcoming" || t.status === "registration") ? (
                      <button onClick={handleRegister} className="flex-1 py-3 px-4 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold uppercase tracking-widest text-center transition-colors shadow-sm">
                        DAFTAR SEKARANG
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <SponsorSection />

      {/* Modal via portal — renders at body level, guarantees true viewport centering */}
      {typeof window !== "undefined" && ReactDOM.createPortal(modalContent, document.body)}
    </>
  );
}
