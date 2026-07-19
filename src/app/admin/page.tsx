import { createClient } from '@/lib/supabase/server';
import React from 'react';
import {
  Users2, Trophy, Swords, CheckCircle2, Clock, Zap,
  TrendingUp, Medal, Calendar, Activity
} from 'lucide-react';
import Link from 'next/link';
import { MatchStatusDonut, TopPlayersBar, MatchesPerDayLine } from '@/components/dashboard/DashboardCharts';
import { STATUS_CONFIG } from '@/app/admin/tournaments/types';

function StatCard({
  label, value, icon, color, sub
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}) {
  return (
    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_2px_16px_0_rgba(0,0,0,0.04)] dark:shadow-none flex items-start gap-4 hover:-translate-y-0.5 transition-transform duration-200">
      <div className={`p-3 rounded-xl shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{label}</p>
        <p className="text-3xl font-bold mt-1 text-gray-900 dark:text-white tabular-nums">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let userName = "Admin";
  if (user) {
    const { data: profile } = await supabase.from('profile').select('fullname').eq('user_id', user.id).single();
    if (profile?.fullname) {
      userName = profile.fullname;
    } else if (user.user_metadata?.fullname) {
      userName = user.user_metadata.fullname;
    }
  }

  // ── Core counts ─────────────────────────────────────────────────────────────
  const [
    { count: countPlayers },
    { count: countTournaments },
    { count: countMatches },
    { count: countOngoing },
  ] = await Promise.all([
    supabase.from('profile').select('*', { count: 'exact', head: true }),
    supabase.from('tournaments').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('tournaments').select('*', { count: 'exact', head: true }).eq('status', 'ongoing'),
  ]);

  // ── Match statuses ───────────────────────────────────────────────────────────
  const [
    { count: matchScheduled },
    { count: matchOngoing },
    { count: matchCompleted },
  ] = await Promise.all([
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'ongoing'),
    supabase.from('matches').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
  ]);

  // ── Recent tournaments ───────────────────────────────────────────────────────
  const { data: recentTournaments } = await supabase
    .from('tournaments')
    .select('id, name, status, start_date')
    .order('start_date', { ascending: false })
    .limit(5);

  // ── Recent completed matches ─────────────────────────────────────────────────
  const { data: recentMatches } = await supabase
    .from('matches')
    .select(`
      id, phase, group_name, match_number, score_team1, score_team2, status,
      teams_team1:teams!team1_id(name),
      teams_team2:teams!team2_id(name),
      tournaments(name)
    `)
    .eq('status', 'completed')
    .order('updated_at', { ascending: false })
    .limit(6);

  // ── Top players by ranking_points ───────────────────────────────────────────
  const { data: topPlayers } = await supabase
    .from('profile')
    .select('id, fullname, username, ranking_points')
    .order('ranking_points', { ascending: false })
    .limit(8);

  // ── Matches per day (last 10 days) ─────────────────────────────────────────
  const { data: matchDates } = await supabase
    .from('matches')
    .select('updated_at, status')
    .eq('status', 'completed')
    .order('updated_at', { ascending: true })
    .limit(200);

  // Group by date (local)
  const dayMap: Record<string, number> = {};
  (matchDates ?? []).forEach((m: any) => {
    const d = new Date(m.updated_at);
    const key = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    dayMap[key] = (dayMap[key] ?? 0) + 1;
  });
  const dayKeys = Object.keys(dayMap).slice(-10);
  const dayCounts = dayKeys.map(k => dayMap[k]);

  // ── Derived chart data ─────────────────────────────────────────────────────
  const playerNames = (topPlayers ?? []).map((p: any) =>
    p.username ? `${p.fullname} (${p.username})` : p.fullname
  );
  const playerPoints = (topPlayers ?? []).map((p: any) => p.ranking_points ?? 0);

  // ── Status badge ────────────────────────────────────────────────────────────
  // Using STATUS_CONFIG from '@/app/admin/tournaments/types'

  const PHASE_LABEL: Record<string, string> = {
    RR: 'Grup',
    SF: 'Semi Final',
    F: 'Final',
    '3RD': 'Juara 3',
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Selamat Datang, {userName}! 👋</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Berikut adalah ringkasan statistik real-time PB Prabu Bandung</p>
      </div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Pengguna"
          value={countPlayers ?? 0}
          icon={<Users2 className="w-5 h-5 text-brand-500" />}
          color="bg-brand-50 dark:bg-brand-500/10"
        />
        <StatCard
          label="Total Turnamen"
          value={countTournaments ?? 0}
          icon={<Trophy className="w-5 h-5 text-amber-500" />}
          color="bg-amber-50 dark:bg-amber-500/10"
          sub={`${countOngoing ?? 0} sedang berlangsung`}
        />
        <StatCard
          label="Total Pertandingan"
          value={countMatches ?? 0}
          icon={<Swords className="w-5 h-5 text-purple-500" />}
          color="bg-purple-50 dark:bg-purple-500/10"
        />
        <StatCard
          label="Pertandingan Selesai"
          value={matchCompleted ?? 0}
          icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
          color="bg-green-50 dark:bg-green-500/10"
          sub={`${matchScheduled ?? 0} dijadwalkan · ${matchOngoing ?? 0} berlangsung`}
        />
      </div>

      {/* ── Charts Row 1 ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Donut - Match Status */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-[0_2px_16px_0_rgba(0,0,0,0.04)] dark:shadow-none">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Status Pertandingan</h3>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Distribusi status semua pertandingan</p>
          <MatchStatusDonut
            scheduled={matchScheduled ?? 0}
            ongoing={matchOngoing ?? 0}
            completed={matchCompleted ?? 0}
          />
        </div>

        {/* Line/Area - Matches per day */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-[0_2px_16px_0_rgba(0,0,0,0.04)] dark:shadow-none">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Pertandingan Selesai per Hari</h3>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Tren pertandingan selesai (10 hari terakhir)</p>
          {dayKeys.length > 0 ? (
            <MatchesPerDayLine dates={dayKeys} counts={dayCounts} />
          ) : (
            <div className="h-[230px] flex items-center justify-center text-sm text-gray-400">
              Belum ada pertandingan selesai
            </div>
          )}
        </div>
      </div>

      {/* ── Charts Row 2 + Tables ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Top Players Bar */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-[0_2px_16px_0_rgba(0,0,0,0.04)] dark:shadow-none">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Top 8 Pemain</h3>
            </div>
            <Link href="/admin/users" className="text-xs text-brand-500 hover:underline">Lihat semua →</Link>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Berdasarkan ranking poin tertinggi</p>
          {playerNames.length > 0 ? (
            <TopPlayersBar names={playerNames} points={playerPoints} />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
              Belum ada data pemain
            </div>
          )}
        </div>

        {/* Recent Tournaments */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-[0_2px_16px_0_rgba(0,0,0,0.04)] dark:shadow-none flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Turnamen Terbaru</h3>
            </div>
            <Link href="/admin/tournaments" className="text-xs text-brand-500 hover:underline">Lihat semua →</Link>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">5 turnamen terakhir</p>
          <div className="space-y-2 flex-1">
            {(recentTournaments ?? []).length === 0 && (
              <p className="text-sm text-gray-400 py-6 text-center">Belum ada turnamen</p>
            )}
            {(recentTournaments ?? []).map((t: any) => {
              const sc = STATUS_CONFIG[t.status as keyof typeof STATUS_CONFIG] ?? { label: t.status, bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' };
              return (
                <div key={t.id} className="flex items-start justify-between gap-2 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 dark:text-white truncate">{t.name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {new Date(t.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                    <span className={`w-1 h-1 rounded-full ${sc.dot}`} />
                    {sc.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Recent Completed Matches ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-[0_2px_16px_0_rgba(0,0,0,0.04)] dark:shadow-none">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Pertandingan Terakhir Selesai</h3>
          </div>
          <Link href="/admin/matches" className="text-xs text-brand-500 hover:underline">Lihat semua →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {(recentMatches ?? []).length === 0 && (
            <p className="text-sm text-gray-400 col-span-3 text-center py-6">Belum ada pertandingan selesai</p>
          )}
          {(recentMatches ?? []).map((m: any) => {
            const t1 = (m.teams_team1?.name ?? 'Tim 1').replace(/\//g, ' & ');
            const t2 = (m.teams_team2?.name ?? 'Tim 2').replace(/\//g, ' & ');
            const s1 = m.score_team1 ?? 0;
            const s2 = m.score_team2 ?? 0;
            const t1Win = s1 > s2;
            const t2Win = s2 > s1;
            const phase = PHASE_LABEL[m.phase] ?? m.phase;
            return (
              <div key={m.id} className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    {phase}{m.group_name ? ` · Grup ${m.group_name}` : ''} · M{m.match_number}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-600 truncate max-w-[120px]">{m.tournaments?.name}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs font-semibold truncate flex-1 text-left ${t1Win ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>{t1}</p>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className={`text-lg font-bold tabular-nums ${t1Win ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{s1}</span>
                    <span className="text-gray-300 dark:text-gray-600 font-light">—</span>
                    <span className={`text-lg font-bold tabular-nums ${t2Win ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{s2}</span>
                  </div>
                  <p className={`text-xs font-semibold truncate flex-1 text-right ${t2Win ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>{t2}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
