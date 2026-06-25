"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Trophy, Flame, Users, Calendar, Tv, Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";

export type Tournament = {
  id: string;
  name: string;
  status: "upcoming" | "ongoing" | "completed";
  location: string;
  start_date: string;
  max_participants: number;
  prize_pool: number;
  entry_fee?: number;
};

export type Match = {
  id: string;
  match_date: string;
  team1_score: number;
  team2_score: number;
  status: string;
  tournament_id: string | null;
  tournaments?: { name: string } | null;
};

interface HomeViewProps {
  tournaments: Tournament[];
  matches: Match[];
  stats: {
    players: number;
    prizePool: number;
    activeMatches: number;
  };
  isAuthenticated?: boolean;
}

const DEFAULT_SLIDES = [
  { src: "/2.jpg", title: "Badminton Competition" },
  { src: "/3.jpeg", title: "Tournament Finals" },
  { src: "/4.png", title: "Community Event" },
  { src: "/5.jpg", title: "Community Event" },
];

export default function AuraHomeView({
  tournaments,
  matches,
  stats,
  isAuthenticated = false,
}: HomeViewProps) {
  // Image Slider Logic
  const [currentSlide, setCurrentSlide] = useState(0);

  // Tournaments Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(tournaments.length / itemsPerPage);
  const currentTournaments = tournaments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % DEFAULT_SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5500);
    return () => clearInterval(timer);
  }, [nextSlide]);

  // We consider both 'ongoing' and 'upcoming' as active/open
  const openTournaments = tournaments.filter((t) => t.status === "ongoing" || t.status === "upcoming");
  // If we have live matches, use them, otherwise use recent completed matches for display
  const liveMatches = matches; // For now we pass whatever matches we have to the grid

  return (
    <div className="pb-20 pt-16 bg-white dark:bg-gray-900">
      {/* Brand Hero Banner - Stacked Mobile / Overlay Desktop */}
      <div className="relative w-full flex flex-col md:block min-h-auto md:min-h-[70vh] bg-white dark:bg-gray-900 md:!bg-gray-900 border-b border-gray-100 dark:border-gray-800 md:!border-gray-800 group">
        
        {/* Full Width Image Slider (Background on Desktop, Top on Mobile) */}
        <div className="relative w-full h-[45vh] sm:h-[50vh] md:absolute md:inset-0 md:h-full z-0">
          {DEFAULT_SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              <img
                src={slide.src}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {/* Subtle dark overlay to ensure white text is always readable (Desktop Only) */}
          <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-20 pointer-events-none" />

          {/* Carousel Arrows (Inside Image) */}
          <button
            onClick={() => setCurrentSlide((prev) => (prev - 1 + DEFAULT_SLIDES.length) % DEFAULT_SLIDES.length)}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-40 p-2 flex items-center justify-center text-white drop-shadow-md hover:text-white/60 transition-all duration-300"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 rotate-180" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-40 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white transition-all duration-300 backdrop-blur-md shadow-lg"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        </div>

        {/* Text Content Area */}
        <div className="relative z-30 w-full md:absolute md:inset-y-0 md:left-0 md:w-[65%] lg:w-[45%] p-6 sm:p-12 md:p-16 lg:p-24 flex flex-col justify-center items-center md:items-start bg-transparent transition-all duration-300">
          <div className="max-w-xl w-full flex flex-col items-center md:items-start text-center md:text-left">
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[13px] sm:text-[14px] md:text-[16px] leading-relaxed mb-6 max-w-[400px] text-slate-600 dark:text-gray-300 md:!text-gray-200"
            >
              Uji ketangkasanmu, mainkan pertandingan seru, ikuti turnamen secara solo maupun bersama tim
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full sm:w-auto"
            >
              <Link
                href="/tournaments"
                className="w-full sm:w-auto px-6 py-3 rounded-lg text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:bg-blue-500 text-center"
              >
                Ikut Turnamen
              </Link>
              <Link
                href="/matches"
                className="w-full sm:w-auto px-6 py-3 rounded-lg text-[10px] md:text-xs font-semibold uppercase tracking-wider transition-all duration-300 border border-solid cursor-pointer border-slate-300 text-slate-700 bg-transparent hover:bg-slate-50 md:!border-white/50 md:!text-white md:hover:!bg-white/10 md:hover:!border-white dark:border-white/50 dark:text-white dark:hover:bg-white/10 dark:hover:border-white text-center"
              >
                Lihat Jadwal Match
              </Link>
            </motion.div>
          </div>

          {/* Carousel Indicators (Dots) */}
          <div className="mt-8 md:mt-0 md:absolute md:bottom-12 md:left-16 lg:left-24 z-20 flex gap-2 justify-center w-full md:w-auto">
            {DEFAULT_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${
                  idx === currentSlide 
                    ? "w-6 bg-slate-800 dark:bg-white md:!bg-white" 
                    : "w-1.5 bg-slate-300 hover:bg-slate-400 dark:bg-white/40 dark:hover:bg-white/80 md:!bg-white/40 md:hover:!bg-white/80"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-12 max-w-[1440px] mx-auto px-4 md:px-8 xl:px-16 mt-12">
      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Prize Pool", val: `Rp ${(stats?.prizePool || 0).toLocaleString('id-ID')}`, desc: "Menanti Sang Juara", icon: Trophy, color: "text-blue-500" },
          { label: "Turnamen Aktif", val: `${tournaments.length} Turnamen`, desc: "Pendaftaran Sedang Dibuka", icon: Flame, color: "text-orange-500" },
          { label: "Pemain Terdaftar", val: `${stats?.players || 0}+ User`, desc: "Dari Berbagai Daerah", icon: Users, color: "text-blue-500" },
          { label: "Acara Terjadwal", val: `${stats?.activeMatches || 0} Match`, desc: "Minggu Ini di turnamen", icon: Calendar, color: "text-emerald-500" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="p-6 rounded-2xl border border-solid transition-all duration-300 bg-white dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 shadow-md shadow-stone-100/50 dark:shadow-none"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-zinc-500">
                  {stat.label}
                </span>
                <div className="p-2.5 rounded-xl bg-stone-100/80 dark:bg-zinc-800/50">
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
                {stat.val}
              </h3>
              <p className="text-xs mt-1 text-stone-500 dark:text-zinc-400">
                {stat.desc}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Grid: Live Streaming / Match Highlights & Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upcoming Tournaments Panel */}
        <div className="lg:col-span-8 p-6 sm:p-8 rounded-2xl border border-solid transition-all duration-300 bg-white dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 shadow-md shadow-stone-100/50 dark:shadow-none">
          <div className="flex justify-between items-center mb-6 border-b border-solid pb-4 border-stone-200/40 dark:border-zinc-800/40">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
              </span>
              <h2 className="text-lg font-bold tracking-tight dark:text-white">Turnamen Hari Ini & Mendatang</h2>
            </div>
            <Link
              href="/tournaments"
              className="text-xs font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-1 cursor-pointer"
            >
              Semua Turnamen <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {tournaments.length > 0 ? (
            <>
              <div className="space-y-4">
                {currentTournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="p-5 rounded-xl border border-solid transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-50 dark:bg-zinc-900/40 border-stone-200/80 dark:border-zinc-800/50"
                  >
                    <div className={`absolute top-2 left-2 text-white text-[9px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded uppercase ${tournament.status === 'ongoing' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                      {tournament.status === 'ongoing' ? 'HARI INI' : 'MENDATANG'}
                    </div>

                    {/* Tournament Info */}
                    <div className="flex-1 mt-2 sm:mt-0">
                      <span className="text-xs block font-mono text-blue-500 mb-1">
                        {new Date(tournament.start_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <h4 className="text-base font-bold dark:text-zinc-100">{tournament.name}</h4>
                    </div>

                    {/* Details */}
                    <div className="flex-1 text-left sm:text-center">
                      <span className="text-xs block text-stone-500 dark:text-zinc-400 mb-1">
                        📍 {tournament.location || "TBA"}
                      </span>
                      <span className="text-sm font-semibold block text-blue-500">
                        Biaya: Rp {(tournament.entry_fee || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="w-full sm:w-auto text-center p-3">
                      <Link
                        href={isAuthenticated ? `/tournaments/${tournament.id}` : "auth/login"}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-colors bg-stone-200 dark:bg-zinc-800 text-stone-800 dark:text-zinc-200 hover:bg-stone-300 dark:hover:bg-zinc-700"
                      >
                        {/* <Trophy className="w-3.5 h-3.5" /> */}
                        Daftar Turnamen
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-stone-200/40 dark:border-zinc-800/40">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 text-xs font-semibold disabled:opacity-50 transition-colors hover:bg-stone-100 dark:hover:bg-zinc-900 dark:text-zinc-300"
                  >
                    Sebelumnya
                  </button>
                  <span className="text-xs font-mono text-stone-500 dark:text-zinc-500">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 text-xs font-semibold disabled:opacity-50 transition-colors hover:bg-stone-100 dark:hover:bg-zinc-900 dark:text-zinc-300"
                  >
                    Berikutnya
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-zinc-500 border border-dashed rounded-xl border-stone-200/50 dark:border-zinc-800/50">
              Tidak ada turnamen dalam waktu dekat. Silakan periksa kalender.
            </div>
          )}
        </div>

        {/* Feature Highlights Quick Box */}
        <div className="lg:col-span-4 p-6 sm:p-8 rounded-2xl border border-solid flex flex-col justify-between transition-all duration-300 bg-white dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 shadow-md shadow-stone-100/50 dark:shadow-none">
          <div>
            <h3 className="text-lg font-bold tracking-tight mb-4 dark:text-white">Kenapa Memilih PB PRABU?</h3>
            <div className="space-y-4">
              {[
                { title: "Sistem Terverifikasi", desc: "Data pemain dijaga ketat untuk integritas turnamen." },
                { title: "Statistik Transparan", desc: "Lihat hasil pertandingan dan klasemen secara langsung." },
                { title: "Komunitas Solid", desc: "Bergabung bersama pemain tangguh dari seluruh Bandung." },
              ].map((f, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold bg-stone-100 dark:bg-blue-500/10 text-stone-700 dark:text-blue-400">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-none mb-1 dark:text-zinc-200">{f.title}</h4>
                    <p className="text-xs leading-relaxed text-stone-500 dark:text-zinc-400">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-solid border-stone-200/30 dark:border-zinc-800/30 mt-6 md:mt-0">
            <Link
              href="/about"
              className="block w-full py-3 rounded-xl text-center text-xs font-bold uppercase tracking-wider transition-colors bg-stone-100 dark:bg-gray-800/60 text-stone-900 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
            >
              Pelajari Selengkapnya
            </Link>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
