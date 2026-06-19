"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { generateScheduleFromSpin, generateScheduleFromParticipants } from '@/lib/match-engine';
import type { ParticipantSlot } from '@/lib/match-engine';
import { syncTournamentStatuses } from '@/lib/utils/tournamentStatus';
import { toast } from 'react-toastify';
import {
  RotateCcw, Play, Trophy, Users, CheckCircle,
  Loader2, RefreshCw, Calendar, ChevronRight, Info, AlertTriangle, History, Sparkles, Terminal, Clock, Gift
} from 'lucide-react';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Modal } from "@/components/ui/modal/modal";
import WheelCanvas from '@/app/(public)/spin-wheel/components/WheelCanvas';
import { WheelSegment } from '@/app/(public)/spin-wheel/types';

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

export default function AdminSpinWheelPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [session, setSession] = useState<SpinSession | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [step, setStep] = useState<'setup' | 'spin' | 'done'>('setup');
  const [useLevelRule, setUseLevelRule] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [winnerModal, setWinnerModal] = useState<PlayerSlot | null>(null);
  const [selectedPaletteKey, setSelectedPaletteKey] = useState<keyof typeof PALETTES>('neon');
  // Format turnamen yang sedang dipilih
  const [matchFormat, setMatchFormat] = useState<'tunggal' | 'ganda'>('ganda');
  const [genderCategory, setGenderCategory] = useState<'putra' | 'putri' | 'campuran'>('campuran');
  const [isTunggalGenerated, setIsTunggalGenerated] = useState(false);

  const [rotation, setRotation] = useState(0);
  const currentAngleRef = useRef(0);
  const animRef = useRef<number>(undefined);
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      await syncTournamentStatuses();
      const { data } = await supabase.from('tournaments')
        .select('id,name,status,match_format,gender_category')
        .eq('status', 'ongoing')
        .order('start_date');
      
      const list = data || [];
      setTournaments(list);
      
      if (list.length === 1 && !selectedTournament) {
        setSelectedTournament(list[0].id);
        setMatchFormat(list[0].match_format || 'ganda');
        setGenderCategory(list[0].gender_category || 'campuran');
      }
    }
    init();
  }, [supabase, selectedTournament]);

  useEffect(() => {
    if (!selectedTournament) return;
    supabase.from('tournament_participants')
      .select('*, profile(id,fullname,level)')
      .eq('tournament_id', selectedTournament)
      .eq('status', 'confirmed')
      .then(({ data }) => setParticipants(data || []));

    if (matchFormat === 'tunggal') {
      supabase.from('matches').select('id').eq('tournament_id', selectedTournament).limit(1).then(({ data }) => {
        setIsTunggalGenerated(!!(data && data.length > 0));
      });
    } else {
      setIsTunggalGenerated(false);
    }
  }, [selectedTournament, matchFormat, supabase]);

  const loadSession = useCallback(async () => {
    if (!selectedTournament) return;
    setLoadingSession(true);
    const { data } = await supabase.from('spin_wheel_sessions')
      .select('*').eq('tournament_id', selectedTournament).maybeSingle();
    if (data) {
      setSession(data as SpinSession);
      setStep(data.status === 'done' ? 'done' : 'spin');
    } else {
      setSession(null);
      setStep('setup');
    }
    setLoadingSession(false);
  }, [selectedTournament, supabase]);

  useEffect(() => { loadSession(); }, [loadSession]);

  // Realtime
  useEffect(() => {
    if (!session?.id) return;
    const channel = supabase.channel(`admin-spin-${session.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'spin_wheel_sessions',
        filter: `id=eq.${session.id}`,
      }, payload => {
        setSession(payload.new as SpinSession);
        if (payload.new.status === 'done') setStep('done');
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.id, supabase]);

  const isOddSpin = (session?.spun_players?.length || 0) % 2 !== 0;
  const lastSpun = session?.spun_players?.[session.spun_players.length - 1];

  const currentCandidates = useMemo(() => {
    const remaining = session?.remaining_players || [];
    if (useLevelRule && isOddSpin && lastSpun?.level) {
      const opposites = remaining.filter(p => p.level && p.level !== lastSpun.level);
      if (opposites.length > 0) return opposites;
    }
    return remaining;
  }, [session?.remaining_players, useLevelRule, isOddSpin, lastSpun]);

  const segments: WheelSegment[] = useMemo(() => {
    const palette = PALETTES[selectedPaletteKey];
    return currentCandidates.map((p, i) => {
      const origIdx = session?.initial_players?.findIndex(x => x.id === p.id) ?? i;
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
  }, [currentCandidates, session?.initial_players, selectedPaletteKey]);

  async function handleStartSession() {
    if (participants.length < 2) {
      toast.error('Minimal 2 peserta terkonfirmasi');
      return;
    }
    const profiles: PlayerSlot[] = participants.map(p => ({
      id: p.profile?.id || '',
      full_name: p.profile?.fullname || '',
      level: p.profile?.level || null,
    }));

    const { data, error } = await supabase.from('spin_wheel_sessions')
      .upsert({
        tournament_id: selectedTournament,
        status: 'waiting',
        initial_players: profiles,
        remaining_players: profiles,
        spun_players: [],
        pairs: [],
        schedule_generated: false,
      }, { onConflict: 'tournament_id' })
      .select().single();

    if (error) { toast.error(error.message); return; }
    setSession(data as SpinSession);
    setStep('spin');
    toast.success('Sesi dimulai! Pemain bisa pantau di /spin-wheel');
  }

  async function handleSpin() {
    if (!session || spinning) return;
    const remaining = session.remaining_players;
    if (remaining.length === 0) return;
    setSpinning(true);

    let candidates = remaining;
    if (useLevelRule && isOddSpin && lastSpun?.level) {
      const opposites = remaining.filter(p => p.level && p.level !== lastSpun.level);
      if (opposites.length > 0) {
        candidates = opposites;
      }
    }

    const extraSpins = 360 * 5 + Math.random() * 360;
    const targetRotation = currentAngleRef.current + extraSpins;
    const dur = 4000;
    const startTime = performance.now();
    const fromAngle = currentAngleRef.current;

    await new Promise<void>(resolve => {
      function frame(now: number) {
        const t = Math.min((now - startTime) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 4);
        const a = fromAngle + (targetRotation - fromAngle) * ease;
        currentAngleRef.current = a;
        setRotation(a);
        if (t < 1) { animRef.current = requestAnimationFrame(frame); }
        else resolve();
      }
      animRef.current = requestAnimationFrame(frame);
    });

    // Tentukan pemain keluar
    const totalSegments = candidates.length;
    const sizePerSegment = 360 / totalSegments;
    const normalizedRotation = currentAngleRef.current % 360;
    const pointerWheelAngle = (270 - normalizedRotation + 360) % 360;
    const idx = Math.floor(pointerWheelAngle / sizePerSegment) % totalSegments;
    const winner = candidates[idx];

    let newSpun = [...session.spun_players, winner];
    let newRemaining = remaining.filter(p => p.id !== winner.id);
    let newPairs = [...session.pairs];
    let newStatus: SpinSession['status'] = 'spinning';

    // Genap → buat pasangan
    if (newSpun.length % 2 === 0) {
      const p1 = newSpun[newSpun.length - 2];
      const p2 = winner;
      newPairs = [...newPairs, { p1, p2 }];
    }

    // Otomatis pasangkan 2 sisa terakhir jika genap (tidak ada yang menggantung)
    if (newRemaining.length === 2 && newSpun.length % 2 === 0) {
      newPairs = [...newPairs, {
        p1: newRemaining[0],
        p2: newRemaining[1],
      }];
      newSpun = [...newSpun, newRemaining[0], newRemaining[1]];
      newRemaining = [];
      newStatus = 'done';
    } 
    // Sisa 1 → BYE
    else if (newRemaining.length === 1) {
      newPairs = [...newPairs, {
        p1: newRemaining[0],
        p2: { id: 'BYE', full_name: 'BYE', isBye: true },
      }];
      newSpun = [...newSpun, newRemaining[0]];
      newRemaining = [];
      newStatus = 'done';
    } else if (newRemaining.length === 0) {
      newStatus = newSpun.length % 2 === 0 ? 'done' : 'spinning';
    }

    const { data, error } = await supabase.from('spin_wheel_sessions')
      .update({
        spun_players: newSpun,
        remaining_players: newRemaining,
        pairs: newPairs,
        status: newStatus,
      })
      .eq('id', session.id)
      .select().single();

    if (error) { toast.error(error.message); }
    else {
      setSession(data as SpinSession);
      if (newStatus === 'done') setStep('done');
      setWinnerModal(winner);
    }
    setSpinning(false);
  }

  async function handleGenerateSchedule() {
    if (!session) return;
    setGenerating(true);
    console.log('[Generate] session.pairs:', session.pairs);
    console.log('[Generate] tournament_id:', session.tournament_id, 'session_id:', session.id);
    const mappedPairs = session.pairs.map(p => ({
      p1: { id: p.p1.id, fullname: p.p1.full_name, isBye: p.p1.isBye, level: p.p1.level },
      p2: { id: p.p2.id, fullname: p.p2.full_name, isBye: p.p2.isBye, level: p.p2.level }
    }));
    const result = await generateScheduleFromSpin(
      session.tournament_id,
      session.id,
      mappedPairs
    );
    console.log('[Generate] result:', result);
    if (result.success) {
      // Persist ke DB agar tidak reset saat reload
      await supabase.from('spin_wheel_sessions')
        .update({ schedule_generated: true })
        .eq('id', session.id);
      toast.success(`Jadwal dibuat! ${result.totalMatches} pertandingan terjadwal`);
      setSession(s => s ? { ...s, schedule_generated: true } : s);
    } else {
      console.error('[Generate] Error:', result.error);
      toast.error(result.error || 'Gagal membuat jadwal');
    }
    setGenerating(false);
  }

  async function confirmReset() {
    if (!session) return;
    await supabase.from('spin_wheel_sessions').delete().eq('id', session.id);
    setSession(null); setStep('setup');
    currentAngleRef.current = 0;
    setRotation(0);
    setShowResetModal(false);
    toast.success('Sesi direset');
  }

  function handleReset() {
    if (!session) return;
    setShowResetModal(true);
  }

  // Preview pembagian grup
  const assignGroups = (teams: any[]): { groupName: string; matches: any[]; teams: any[] }[] => { return []; };
  const previewGroups = session?.pairs?.length && session.pairs.length > 4
    ? assignGroups(session.pairs.map((p, i) => ({
        p1: p.p1, p2: p.p2, spinOrder: i + 1,
      })))
    : [];
    
  const isDirectKnockout = session?.pairs?.length ? session.pairs.length <= 2 : false;

  // Compute match category from gender + format
  const matchCategory = matchFormat === 'tunggal'
    ? genderCategory === 'putra' ? 'tunggal_putra' : 'tunggal_putri'
    : genderCategory === 'putra' ? 'ganda_putra'
    : genderCategory === 'putri' ? 'ganda_putri'
    : 'ganda_campuran';

  async function handleGenerateForTunggal() {
    setGenerating(true);
    const slots: ParticipantSlot[] = participants.map(p => ({
      playerId: p.profile?.id || '',
      fullName: p.profile?.fullname || '',
    }));
    const result = await generateScheduleFromParticipants(
      selectedTournament,
      slots,
      matchCategory
    );
    if (result.success) {
      toast.success(`Jadwal tunggal dibuat! ${result.totalMatches} pertandingan terjadwal`);
      setIsTunggalGenerated(true);
    } else {
      toast.error(result.error || 'Gagal membuat jadwal');
    }
    setGenerating(false);
  }

  const tournament = tournaments.find(t => t.id === selectedTournament);
  const remainingCount = session?.remaining_players?.length || 0;

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Spin Wheel Live" />

      {/* Setup */}
      {step === 'setup' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            <h2 className="font-display font-semibold text-sm text-gray-900 dark:text-white">Setup Sesi</h2>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-gray-700 dark:text-gray-300">Turnamen</label>
              <select className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition cursor-pointer" value={selectedTournament}
                onChange={e => {
                  const tid = e.target.value;
                  setSelectedTournament(tid);
                  const t = tournaments.find(t => t.id === tid);
                  if (t) {
                    setMatchFormat(t.match_format || 'ganda');
                    setGenderCategory(t.gender_category || 'campuran');
                  }
                }}>
                <option value="">-- Pilih Turnamen --</option>
                {tournaments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            {/* Badge format */}
            {selectedTournament && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  matchFormat === 'tunggal'
                    ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300'
                    : 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                }`}>
                  {matchFormat === 'tunggal' ? '🏃 Tunggal' : '👥 Ganda'}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  genderCategory === 'putra' ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300'
                  : genderCategory === 'putri' ? 'bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300'
                  : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300'
                }`}>
                  {genderCategory === 'putra' ? '♂ Putra' : genderCategory === 'putri' ? '♀ Putri' : '⚥ Campuran'}
                </span>
              </div>
            )}

            {selectedTournament && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    Peserta Terkonfirmasi ({participants.length})
                  </p>
                  {participants.length % 2 !== 0 && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Ganjil → 1 orang dapat BYE
                    </span>
                  )}
                </div>

                {/* Info grup */}
                {participants.length >= 4 && (
                  <div className="px-3 py-2 rounded-lg text-xs mb-3 flex items-start gap-2 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                    <Info size={13} className="mt-0.5 flex-shrink-0" />
                    <span>
                      {participants.length} peserta → {Math.ceil(participants.length / 2)} pasangan →{' '}
                      {Math.ceil(participants.length / 8)} grup (4 tim/grup) → RR per grup
                    </span>
                  </div>
                )}

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
                  {participants.map((p, i) => {
                    const palette = PALETTES[selectedPaletteKey];
                    const theme = palette[i % palette.length];
                    return (
                    <div key={p.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm"
                        style={{ background: theme.fill, color: theme.text }}>
                        {i + 1}
                      </div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">
                        {p.profile?.fullname}
                      </p>
                    </div>
                  )})}
                </div>
              </div>
            )}

            {selectedTournament && matchFormat !== 'tunggal' && (
              <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                <input 
                  type="checkbox" 
                  id="useLevelRule" 
                  checked={useLevelRule} 
                  onChange={e => setUseLevelRule(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <label htmlFor="useLevelRule" className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1">
                  Gunakan Peraturan By Level (Utama dipasangkan dengan Pratama)
                </label>
              </div>
            )}

            {selectedTournament && participants.length >= 2 && (
              <>
                {matchFormat === 'tunggal' ? (
                  /* ─── TUNGGAL: tombol generate langsung ─── */
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 px-3 py-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 text-xs text-violet-700 dark:text-violet-300">
                      <Info size={13} className="mt-0.5 flex-shrink-0" />
                      <span>
                        Format <strong>Tunggal</strong> — setiap peserta langsung dijadwalkan secara Round Robin.
                        Spin Wheel tidak diperlukan.
                      </span>
                    </div>
                    {isTunggalGenerated ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                          <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                            Jadwal sudah di-generate
                          </span>
                        </div>
                        <button onClick={() => setIsTunggalGenerated(false)} className="w-full inline-flex items-center gap-2 justify-center text-sm py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                          <RefreshCw size={14} /> Ulangi Generate
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleGenerateForTunggal}
                        disabled={generating}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 w-full rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-sm"
                      >
                        {generating
                          ? <><Loader2 size={15} className="animate-spin" /> Membuat jadwal...</>
                          : <><Calendar size={15} /> Generate Jadwal Tunggal Otomatis</>}
                      </button>
                    )}
                  </div>
                ) : (
                  /* ─── GANDA: tombol mulai spin wheel ─── */
                  <button onClick={handleStartSession} className="inline-flex items-center justify-center gap-2 px-4 py-2 w-full rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors shadow-sm">
                    <Play size={16} /> Mulai Sesi Spin Wheel
                  </button>
                )}
              </>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-center min-h-64">
            <div className="text-center">
              {/* <div className="text-5xl mb-3">🎡</div> */}
              <p className="font-display font-semibold text-sm text-gray-900 dark:text-white">
                Pilih turnamen untuk mulai
              </p>
              <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                Pemain bisa pantau live di /spin-wheel
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Spinning */}
      {step === 'spin' && session && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-4">
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse bg-green-500" />
                  <span className="text-xs font-medium text-green-500">LIVE</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{tournament?.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer bg-white dark:bg-gray-900 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
                    <input type="checkbox" checked={useLevelRule} onChange={e => setUseLevelRule(e.target.checked)} className="rounded text-brand-500" />
                    By Level
                  </label>
                  <button onClick={handleReset} className="inline-flex items-center gap-1 text-xs py-1 px-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <RefreshCw size={11} /> Reset
                  </button>
                </div>
              </div>

              <div className="relative flex justify-center w-full">
                <WheelCanvas
                  segments={segments}
                  rotation={rotation}
                  isSpinning={spinning}
                  soundEnabled={true}
                />
              </div>

              {remainingCount > 0 ? (
                <button onClick={handleSpin} disabled={spinning}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-base font-bold transition-colors w-full max-w-xs justify-center shadow-md">
                  {spinning
                    ? <><RotateCcw size={18} className="animate-spin" /> Memutar...</>
                    : <><RotateCcw size={18} /> {isOddSpin ? 'Putar Pasangan' : 'Putar Pemain'}</>
                  }
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm font-medium text-green-500 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
                  <CheckCircle size={18} /> Semua terpasang!
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                  Sisa ({remainingCount})
                </p>
                <Users size={14} className="text-gray-500 dark:text-gray-400" />
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                {session.remaining_players.map((p, i) => {
                  const origIdx = session.initial_players.findIndex(x => x.id === p.id);
                  const palette = PALETTES[selectedPaletteKey];
                  const theme = palette[(origIdx >= 0 ? origIdx : i) % palette.length];
                  return (
                  <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                    <div className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ background: theme.fill }} />
                    <span className="text-xs text-gray-900 dark:text-white">{p.full_name}</span>
                  </div>
                )})}
              </div>
            </div>


            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                  Pasangan ({session.pairs.length})
                </p>
                <Trophy size={14} className="text-gray-500 dark:text-gray-400" />
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {session.pairs.map((pair, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-2 rounded-lg text-xs bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                    <span className="font-bold w-4 text-center text-gray-500 dark:text-gray-400">{i + 1}</span>
                    <span className="flex-1 truncate font-medium text-gray-900 dark:text-white">{pair.p1.full_name}</span>
                    <span className="font-bold text-brand-500">+</span>
                    <span className={`flex-1 truncate text-right ${pair.p2.isBye ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                      {pair.p2.isBye ? 'BYE' : pair.p2.full_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* THEME COLOR PALETTE SELECTION */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl shadow-sm">
              <h2 className="font-display font-semibold text-xs uppercase tracking-wider text-blue-500 dark:text-blue-400 mb-3.5 flex items-center gap-2">
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

      {/* Done */}
      {step === 'done' && session && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-gradient-to-br from-brand-50 to-gray-50 dark:from-brand-900/20 dark:to-gray-800 p-8 rounded-2xl border border-brand-200 dark:border-brand-800 text-center">
            <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
            <h2 className="font-display font-bold text-2xl mb-1 text-gray-900 dark:text-white">
              Undian Selesai!
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {session.pairs.length} pasangan → {previewGroups.length} grup terbentuk
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Grup preview */}
            <div className="space-y-3">
              {isDirectKnockout ? (
                <>
                  <h3 className="font-display font-semibold text-sm text-gray-900 dark:text-white">
                    Peserta {session.pairs.length <= 2 ? 'Final' : 'Semi Final'} (Langsung Fase Gugur)
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-3">
                      Karena hanya terdapat {session.pairs.length} tim, fase grup (Round Robin) ditiadakan. Tim akan langsung berhadapan di babak {session.pairs.length <= 2 ? 'Final' : 'Semi Final'}.
                    </p>
                    <div className="space-y-1.5">
                      {session.pairs.map((team, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                          <span className="w-4 text-center font-bold text-brand-500">
                            {i + 1}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">{team.p1.full_name}</span>
                          <ChevronRight size={10} className="text-brand-500" />
                          <span className={team.p2.isBye ? 'text-gray-400' : 'text-gray-900 dark:text-white'}>
                            {team.p2.isBye ? 'BYE' : team.p2.full_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-display font-semibold text-sm text-gray-900 dark:text-white">
                    Pembagian Grup (4 tim/grup)
                  </h3>
                  {previewGroups.map(group => (
                <div key={group.groupName} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-brand-500">
                      {group.groupName}
                    </div>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white">
                      Grup {group.groupName}
                    </p>
                    <span className="text-xs ml-auto text-gray-500 dark:text-gray-400">
                      {group.matches.length} match RR
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {group.teams.map((team, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                        <span className="w-4 text-center font-bold text-gray-500 dark:text-gray-400">
                          {i + 1}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">{team.p1.full_name}</span>
                        <ChevronRight size={10} className="text-brand-500" />
                        <span className={team.p2.isBye ? 'text-gray-400' : 'text-gray-900 dark:text-white'}>
                          {team.p2.isBye ? 'BYE' : team.p2.full_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              </>
              )}
            </div>

            {/* Generate action */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col justify-center gap-5">
              <div className="text-center">
                <Calendar size={40} className="mx-auto mb-3 text-brand-500" />
                <h3 className="font-display font-bold text-lg mb-2 text-gray-900 dark:text-white">
                  Generate Jadwal
                </h3>
                  {isDirectKnockout ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sistem akan membuat jadwal langsung untuk babak {session.pairs.length <= 2 ? 'Final' : 'Semi Final'} tanpa melalui fase grup.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sistem akan membuat semua jadwal Round Robin per grup.
                      Juara & Runner-up tiap grup otomatis lolos ke fase gugur.
                    </p>
                  )}
              </div>

              <div className="px-3 py-2.5 rounded-lg text-xs space-y-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                {isDirectKnockout ? (
                  <>
                    <p>{session.pairs.length <= 2 ? '1 match (Final)' : '2 match (Semi Final)'}</p>
                    <p>Tim langsung memperebutkan gelar juara</p>
                  </>
                ) : (
                  <>
                    <p>{previewGroups.length} grup × {Math.ceil((4 * 3) / 2)} match = ~{previewGroups.length * 6} match RR</p>
                    <p>Top 2 tiap grup lolos ke fase gugur</p>
                    <p>Fase gugur ditentukan otomatis dari jumlah tim lolos</p>
                  </>
                )}
              </div>

              {session.schedule_generated ? (
                <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                    Jadwal sudah di-generate
                  </span>
                </div>
              ) : (
                <button onClick={handleGenerateSchedule} disabled={generating}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-base font-bold transition-colors w-full justify-center shadow-md">
                  {generating
                    ? <><Loader2 size={18} className="animate-spin" /> Membuat jadwal...</>
                    : <><Calendar size={18} /> Generate Jadwal Otomatis</>
                  }
                </button>
              )}

              <button onClick={handleReset} className="inline-flex items-center gap-2 justify-center text-sm py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <RefreshCw size={14} /> Ulangi Undian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Modal */}
      <Modal isOpen={showResetModal} onClose={() => setShowResetModal(false)} className="max-w-sm mx-auto">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-500/10">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Reset Sesi Undian?
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tindakan ini tidak dapat dibatalkan
              </p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
            Apakah Anda yakin ingin mereset sesi ini? Jadwal yang sudah dibuat (jika ada) tidak akan dihapus.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowResetModal(false)}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={confirmReset}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
            >
              Ya, Reset Sesi
            </button>
          </div>
        </div>
      </Modal>

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
                 ? 'Pemain pertama telah terpilih. Putar sekali lagi untuk menentukan pasangannya!'
                 : 'Pasangan telah terbentuk! Lanjutkan untuk memutar pemain berikutnya.'}
             </p>
             
             <button 
               onClick={() => setWinnerModal(null)}
               className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.2)] dark:shadow-[0_0_20px_rgba(37,99,235,0.3)]"
             >
               LANJUTKAN
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
