"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import { createClient } from "@/lib/supabase/client";
import WheelCanvas from "./components/WheelCanvas";
import { WheelSegment } from "./types";
import { Trophy, Users, Info, ChevronRight, CheckCircle, History, Sparkles, Terminal, Clock, Gift } from "lucide-react";
import { syncTournamentStatuses } from "@/lib/utils/tournamentStatus";

const PALETTES = {
  rainbow: [
    { fill: "#f87171", text: "#ffffff" }, { fill: "#fb923c", text: "#ffffff" },
    { fill: "#facc15", text: "#1e293b" }, { fill: "#4ade80", text: "#1e293b" },
    { fill: "#2dd4bf", text: "#1e293b" }, { fill: "#60a5fa", text: "#ffffff" },
    { fill: "#c084fc", text: "#ffffff" }, { fill: "#f472b6", text: "#ffffff" }
  ],
  neon: [
    { fill: "#06b6d4", text: "#ffffff" }, { fill: "#ec4899", text: "#ffffff" },
    { fill: "#a855f7", text: "#ffffff" }, { fill: "#10b981", text: "#ffffff" },
    { fill: "#f59e0b", text: "#1e293b" }, { fill: "#e11d48", text: "#ffffff" }
  ],
  sunset: [
    { fill: "#f43f5e", text: "#ffffff" }, { fill: "#f97316", text: "#ffffff" },
    { fill: "#db2777", text: "#ffffff" }, { fill: "#fbbf24", text: "#1e293b" },
    { fill: "#ca8a04", text: "#ffffff" }, { fill: "#e11d48", text: "#ffffff" }
  ],
  pastel: [
    { fill: "#ffb7b2", text: "#3c2a21" }, { fill: "#ffd1b3", text: "#3c2a21" },
    { fill: "#ffdac1", text: "#3c2a21" }, { fill: "#e2f0cb", text: "#3c2a21" },
    { fill: "#b5ead7", text: "#3c2a21" }, { fill: "#c7ceea", text: "#3c2a21" },
    { fill: "#ffc6ff", text: "#3c2a21" }
  ],
  cyberpunk: [
    { fill: "#0f172a", text: "#38bdf8" }, { fill: "#1e293b", text: "#f43f5e" },
    { fill: "#334155", text: "#a855f7" }, { fill: "#0f172a", text: "#4ade80" },
    { fill: "#1e293b", text: "#f59e0b" }
  ]
};

interface PlayerSlot { id: string; full_name: string; isBye?: boolean; level?: string | null; }
interface Pair { p1: PlayerSlot; p2: PlayerSlot; }

interface SpinSession {
  id: string;
  tournament_id: string;
  status: 'waiting' | 'spinning' | 'done';
  initial_players: PlayerSlot[];
  spun_players: PlayerSlot[];
  remaining_players: PlayerSlot[];
  pairs: Pair[];
  schedule_generated: boolean;
}

export default function SpinWheelSpectatorPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  
  const [session, setSession] = useState<SpinSession | null>(null);
  const [segments, setSegments] = useState<WheelSegment[]>([]);
  
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerModal, setWinnerModal] = useState<PlayerSlot | null>(null);
  const [selectedPaletteKey, setSelectedPaletteKey] = useState<keyof typeof PALETTES>('neon');

  const localSpunCount = useRef(0);
  const animRef = useRef<number>(undefined);
  const currentAngleRef = useRef(0);
  const pendingSession = useRef<SpinSession | null>(null);

  const supabase = createClient();

  // 1. Fetch tournaments
  useEffect(() => {
    async function init() {
      await syncTournamentStatuses();
      const { data } = await supabase.from('tournaments')
        .select('id,name,status')
        .eq('status', 'ongoing')
        .order('start_date');
      
      const list = data || [];
      setTournaments(list);
      
      if (list.length === 1) {
        setSelectedTournament(list[0].id);
      }
    }
    init();
  }, [supabase]);

  // 2. Fetch initial session
  const loadSession = useCallback(async () => {
    if (!selectedTournament) return;
    const { data } = await supabase.from('spin_wheel_sessions')
      .select('*').eq('tournament_id', selectedTournament).maybeSingle();
    
    if (data) {
      const sess = data as SpinSession;
      setSession(sess);
      localSpunCount.current = sess.spun_players?.length || 0;
      updateSegments(sess.remaining_players, sess.initial_players);
    } else {
      setSession(null);
      setSegments([]);
    }
  }, [selectedTournament, supabase]);

  useEffect(() => { loadSession(); }, [loadSession]);

  const updateSegments = useCallback((remaining: PlayerSlot[], initial: PlayerSlot[]) => {
    const palette = PALETTES[selectedPaletteKey];
    const newSegs: WheelSegment[] = remaining.map((p, i) => {
      const origIdx = initial.findIndex(x => x.id === p.id);
      const colorIdx = origIdx >= 0 ? origIdx : i;
      const theme = palette[colorIdx % palette.length];
      return {
        id: p.id,
        text: p.full_name,
        weight: 1,
        color: theme.fill,
        textColor: theme.text
      };
    });
    setSegments(newSegs);
  }, [selectedPaletteKey]);

  useEffect(() => {
    if (session) {
      updateSegments(session.remaining_players, session.initial_players);
    }
  }, [selectedPaletteKey, updateSegments]);

  // 3. Realtime Subscription
  useEffect(() => {
    if (!session?.id) return;
    
    const channel = supabase.channel(`public-spin-${session.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'spin_wheel_sessions',
        filter: `id=eq.${session.id}`,
      }, payload => {
        const newData = payload.new as SpinSession;
        const newSpunCount = newData.spun_players?.length || 0;
        
        // Cek jika admin baru saja melakukan spin (jumlah spun_players bertambah)
        if (newSpunCount > localSpunCount.current) {
          const winner = newData.spun_players[newSpunCount - 1];
          pendingSession.current = newData;
          triggerSpinAnimation(winner);
        } else if (newData.remaining_players.length === 0 || newData.status === 'done') {
           // Reset atau selesai
           setSession(newData);
           updateSegments(newData.remaining_players, newData.initial_players);
        } else if (!isSpinning) {
           // Jika tidak sedang berputar, update biasa
           setSession(newData);
           updateSegments(newData.remaining_players, newData.initial_players);
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.id, supabase, isSpinning, selectedPaletteKey]);

  // Easing function
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  const triggerSpinAnimation = (winner: PlayerSlot) => {
    setIsSpinning(true);
    setWinnerModal(null);
    
    // Cari index winner di wheel saat ini
    const winnerIndex = segments.findIndex(s => s.id === winner.id);
    if (winnerIndex === -1) {
      // Fallback
      finalizeSpin(winner);
      return;
    }

    const totalSegments = segments.length;
    const sliceAngle = 360 / totalSegments;
    
    // Pointer menunjuk ke 270 derajat.
    // Agar index `winnerIndex` berada di 270 derajat,
    // (winnerIndex * sliceAngle + targetRotation + sliceAngle/2) % 360 = 270
    const centerOffset = sliceAngle / 2;
    const targetBase = 270 - (winnerIndex * sliceAngle + centerOffset);
    
    // Putar minimal 5x (5 * 360 = 1800)
    const extraSpins = 360 * 5;
    
    // Hitung sisa rotasi dari sudut saat ini
    const currentMod = currentAngleRef.current % 360;
    let delta = targetBase - currentMod;
    if (delta < 0) delta += 360;
    
    const targetRotation = currentAngleRef.current + extraSpins + delta;
    const startAngle = currentAngleRef.current;
    const durationMs = 4000;
    const startTime = performance.now();

    const animateSpin = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easeProgress = easeOutCubic(progress);
      
      const current = startAngle + (targetRotation - startAngle) * easeProgress;
      currentAngleRef.current = current;
      setRotation(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animateSpin);
      } else {
        finalizeSpin(winner);
      }
    };
    
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animateSpin);
  };

  const finalizeSpin = (winner: PlayerSlot) => {
    setIsSpinning(false);
    setWinnerModal(winner);
    
    // Confetti
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#ea580c", "#3b82f6", "#16a34a", "#facc15"] });

    // Terapkan data session yang tertunda (menghilangkan pemenang dari roda)
    if (pendingSession.current) {
      const sess = pendingSession.current;
      setSession(sess);
      updateSegments(sess.remaining_players, sess.initial_players);
      localSpunCount.current = sess.spun_players.length;
      pendingSession.current = null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-display font-black text-gray-900 dark:text-white uppercase tracking-tight">
             Spin Wheel Live 🔴
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Pantau proses pengundian secara langsung</p>
        </div>

        {/* Pemilihan Turnamen */}
        {!session && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 max-w-md mx-auto">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Pilih Turnamen yang Sedang Berjalan
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={selectedTournament}
              onChange={e => setSelectedTournament(e.target.value)}
            >
              <option value="">-- Pilih Turnamen --</option>
              {tournaments.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Live Area */}
        {session && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center min-h-[500px]">
                
                <div className="w-full flex items-center justify-between mb-8 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full animate-pulse bg-green-500 shadow-[0_0_8px_#22c55e]" />
                    <span className="text-xs font-bold text-green-500 tracking-wider">LIVE RECORDING</span>
                  </div>
                  {isSpinning ? (
                    <span className="px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-bold animate-pulse">
                      MEMUTAR...
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">Menunggu Admin...</span>
                  )}
                </div>

                <div className="flex-1 w-full flex items-center justify-center pb-8 relative">
                   <WheelCanvas
                     segments={segments}
                     rotation={rotation}
                   />
                </div>
              </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              {/* Sisa Pemain */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-gray-900 dark:text-white">Sisa Pemain</h3>
                  <div className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">
                    {session.remaining_players.length}
                  </div>
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
                  {session.remaining_players.map((p, i) => {
                    const origIdx = session.initial_players.findIndex(x => x.id === p.id);
                    const palette = PALETTES[selectedPaletteKey];
                    const theme = palette[(origIdx >= 0 ? origIdx : i) % palette.length];
                    return (
                      <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-900/50">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ background: theme.fill }}
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {p.full_name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>


              {/* Pasangan */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-gray-900 dark:text-white">Pasangan</h3>
                  <Trophy size={16} className="text-brand-500" />
                </div>
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2">
                  {session.pairs.map((pair, i) => (
                    <div key={i} className="flex flex-col gap-1 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-900 dark:text-white truncate flex-1">{pair.p1.full_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-brand-500 bg-brand-50 dark:bg-brand-900/20 px-1.5 py-0.5 rounded">VS / +</span>
                        <span className={`text-xs font-bold truncate flex-1 ${pair.p2.isBye ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                          {pair.p2.isBye ? 'BYE' : pair.p2.full_name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* THEME COLOR PALETTE SELECTION */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 rounded-3xl shadow-sm">
                <h2 className="font-display font-semibold text-xs uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-4 flex items-center gap-2">
                  <Sparkles size={14} />
                  Aesthetic Skema Warna
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(PALETTES) as Array<keyof typeof PALETTES>).map((key) => {
                    const paletteSlices = PALETTES[key].slice(0, 5);
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedPaletteKey(key)}
                        className={`flex items-center gap-2 py-1.5 px-3 rounded-xl border transition-all truncate cursor-pointer ${
                          selectedPaletteKey === key
                            ? "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-300 font-bold"
                            : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                        }`}
                      >
                        <div className="flex -space-x-1 flex-shrink-0">
                          {paletteSlices.map((color, cIdx) => (
                            <div
                              key={cIdx}
                              className="w-3.5 h-3.5 rounded-full border border-gray-900 dark:border-slate-950"
                              style={{ backgroundColor: color.fill }}
                            />
                          ))}
                        </div>
                        <span className="text-xs capitalize">{key}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* LIVE WINNERS FEED (Log Pemain Terpilih) - ACTIVITY LOGS STYLE */}
              <div 
                id="activity-logs-panel"
                className="bg-white dark:bg-gray-900 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col max-h-[350px]"
              >
                <div className="p-4 bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-500 dark:text-gray-400" />
                    <h4 className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">LOG PEMAIN TERPILIH</h4>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">{session.spun_players.length} Pemain</span>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                  {session.spun_players.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                      <Clock className="w-8 h-8 text-slate-300 dark:text-gray-600" />
                      <p className="text-xs text-slate-400 dark:text-gray-500 font-medium">Belum ada aktivitas di sesi ini.</p>
                    </div>
                  ) : (
                    [...session.spun_players].reverse().map((p, idx) => {
                      const origIdx = session.initial_players.findIndex(x => x.id === p.id);
                      const realIndex = session.spun_players.length - 1 - idx;
                      const palette = PALETTES[selectedPaletteKey];
                      const theme = palette[(origIdx >= 0 ? origIdx : realIndex) % palette.length];
                      return (
                        <div 
                          key={p.id + idx} 
                          className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 hover:bg-slate-50 dark:hover:bg-gray-800 border border-slate-200 dark:border-gray-800 transition-all text-xs"
                        >
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border shadow-sm font-bold text-[10px]"
                            style={{ backgroundColor: `${theme.fill}15`, color: theme.fill, borderColor: `${theme.fill}30` }}
                          >
                            #{realIndex + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-700 dark:text-gray-300 leading-normal font-bold truncate">{p.full_name}</p>
                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 dark:text-gray-500">
                              <span>Berhasil terpilih dari undian</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Aesthetic Winner Modal */}
      {winnerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-gray-900/80 backdrop-blur-sm animate-fade-in" onClick={() => setWinnerModal(null)}>
          <div className="bg-white dark:bg-[#0b1120] rounded-[2rem] p-8 max-w-sm w-full shadow-2xl transform transition-all text-center border border-gray-100 dark:border-gray-800 relative overflow-hidden" onClick={e => e.stopPropagation()}>
             {/* Glow effect */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-blue-500/10 dark:bg-blue-500/20 blur-[50px] pointer-events-none"></div>
             
             <h2 className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mb-2">
               {session?.spun_players.length && session.spun_players.length % 2 !== 0 ? 'Pemain Pertama Dipilih!' : 'Roda Telah Berhenti!'}
             </h2>
             
             <p className="text-4xl font-display font-black text-gray-900 dark:text-white mb-6 tracking-tight">
               {winnerModal.full_name}
             </p>
             
             <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 px-4 leading-relaxed">
               {session?.spun_players.length && session.spun_players.length % 2 !== 0 
                 ? 'Pemain pertama telah terpilih. Menunggu putaran admin selanjutnya untuk menentukan pasangan!'
                 : 'Pasangan telah terbentuk!'}
             </p>
             
             <button 
               onClick={() => setWinnerModal(null)}
               className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.2)] dark:shadow-[0_0_20px_rgba(37,99,235,0.3)]"
             >
               TUTUP
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
