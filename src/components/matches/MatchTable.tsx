"use client";

import React, { useState, useEffect } from "react";
import { Edit2, CheckCircle2, Clock, AlertCircle, Zap, Shield, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";

interface Team {
  id: string;
  name: string;
  is_bye_team: boolean;
}

import {
  isPhaseComplete,
  getCurrentDeepestPhase,
  generateNextKnockoutPhase
} from "@/lib/utils/knockout-engine";
import { autoDistributePoints } from "@/lib/actions/point";

export interface Match {
  id: string;
  tournament_id: string;
  phase: string;
  group_name: string | null;
  round_number: number | null;
  match_number: number | null;
  status: string | null;
  category: string | null;
  score_team1: number | null;
  score_team2: number | null;
  winner_team_id: string | null;
  is_bye: boolean | null;
  team1_id: string | null;
  team2_id: string | null;
  teams_team1?: Team | null;
  teams_team2?: Team | null;
  tournaments?: {
    name: string;
    start_date: string;
    points?: { name: string } | null;
  } | null;
}

interface MatchTableProps {
  loading: boolean;
  matches: Match[];
  onInputScore?: (match: Match) => void;
  onDeleteMatch?: (matchId: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  scheduled: {
    label: "Dijadwalkan",
    icon: <Clock className="w-3 h-3" />,
    bg: "bg-sky-100 dark:bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-400",
  },
  ongoing: {
    label: "Berlangsung",
    icon: <Zap className="w-3 h-3" />,
    bg: "bg-amber-100 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
  },
  completed: {
    label: "Selesai",
    icon: <CheckCircle2 className="w-3 h-3" />,
    bg: "bg-green-100 dark:bg-green-500/10",
    text: "text-green-700 dark:text-green-400",
  },
};

const PHASE_CONFIG: Record<string, { label: string; shortLabel: string; bg: string; text: string }> = {
  RR:  { label: "Round Robin",   shortLabel: "RR",  bg: "bg-brand-50 dark:bg-brand-500/10",  text: "text-brand-700 dark:text-brand-400" },
  SF:  { label: "Semi Final",    shortLabel: "SF",  bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-700 dark:text-purple-400" },
  F:   { label: "Final",         shortLabel: "F",   bg: "bg-amber-50 dark:bg-amber-500/10",   text: "text-amber-700 dark:text-amber-400" },
  "3RD": { label: "Perebutan Juara 3", shortLabel: "3rd", bg: "bg-orange-50 dark:bg-orange-500/10", text: "text-orange-700 dark:text-orange-400" },
};

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; bg: string; text: string }> = {
  tunggal_putra:   { label: "T. Putra",  emoji: "🏸", bg: "bg-blue-50 dark:bg-blue-500/10",   text: "text-blue-700 dark:text-blue-400" },
  tunggal_putri:  { label: "T. Putri",  emoji: "🏸", bg: "bg-pink-50 dark:bg-pink-500/10",   text: "text-pink-700 dark:text-pink-400" },
  ganda_putra:    { label: "G. Putra",  emoji: "🏸", bg: "bg-sky-50 dark:bg-sky-500/10",     text: "text-sky-700 dark:text-sky-400" },
  ganda_putri:    { label: "G. Putri",  emoji: "🏸", bg: "bg-rose-50 dark:bg-rose-500/10",   text: "text-rose-700 dark:text-rose-400" },
  ganda_campuran: { label: "G. Camp.",  emoji: "🏸", bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-700 dark:text-violet-400" },
};

export const CATEGORY_OPTIONS = [
  { value: "tunggal_putra",   label: "Tunggal Putra" },
  { value: "tunggal_putri",  label: "Tunggal Putri" },
  { value: "ganda_putra",    label: "Ganda Putra" },
  { value: "ganda_putri",    label: "Ganda Putri" },
  { value: "ganda_campuran", label: "Ganda Campuran" },
];

function StatusBadge({ status }: { status: string | null }) {
  const cfg = STATUS_CONFIG[status ?? "scheduled"] ?? STATUS_CONFIG["scheduled"];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

function PhaseBadge({ phase }: { phase: string }) {
  const cfg = PHASE_CONFIG[phase] ?? PHASE_CONFIG["RR"];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
      <Shield className="w-2.5 h-2.5" />
      {cfg.shortLabel}
    </span>
  );
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return <span className="text-xs text-gray-400 dark:text-gray-600">—</span>;
  const cfg = CATEGORY_CONFIG[category];
  if (!cfg) return <span className="text-xs text-gray-400 dark:text-gray-600">{category}</span>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 dark:border-white/[0.05]">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-5 py-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

// ─── Match Grid Component ──────────────────────────────────────────────────────

function MatchGrid({ matches: initialMatches, onInputScore, onDeleteMatch }: { matches: Match[]; onInputScore?: (m: Match) => void; onDeleteMatch?: (id: string) => void }) {
  const [matches, setMatches] = useState<Match[]>(initialMatches);
  const supabase = createClient();

  useEffect(() => {
    setMatches(initialMatches);
  }, [initialMatches]);

  const handleScoreUpdate = async (matchId: string, team: 1 | 2, newScoreRaw: number) => {
    const targetMatch = matches.find(m => m.id === matchId);
    if (!targetMatch) return;
    
    // Validate score max 30
    let newScore = Math.max(0, Math.min(30, newScoreRaw));
    if (isNaN(newScore)) newScore = 0;

    const currentScore = team === 1 ? (targetMatch.score_team1 || 0) : (targetMatch.score_team2 || 0);
    if (newScore === currentScore) return;

    const otherScore = team === 1 ? (targetMatch.score_team2 || 0) : (targetMatch.score_team1 || 0);
    
    if (newScore === otherScore) {
      toast.error("Skor kedua tim tidak boleh sama");
      return;
    }

    const isCompleted = newScore >= 30 || otherScore >= 30;

    // Optimistic UI Update
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return {
          ...m,
          ...(team === 1 ? { score_team1: newScore } : { score_team2: newScore }),
          ...(isCompleted ? { status: 'completed' } : {})
        };
      }
      return m;
    }));

    const updateData: any = team === 1 ? { score_team1: newScore } : { score_team2: newScore };

    if (isCompleted) {
      updateData.status = 'completed';
      const score1 = team === 1 ? newScore : otherScore;
      const score2 = team === 2 ? newScore : otherScore;
      updateData.winner_team_id = score1 > score2 ? targetMatch.team1_id : score2 > score1 ? targetMatch.team2_id : null;
    }

    const { error } = await supabase.from('matches').update(updateData).eq('id', matchId);
    if (error) {
       toast.error(`Gagal update skor: ${error.message}`);
       // Revert back on error
       setMatches(initialMatches);
    } else {
       if (isCompleted) {
         toast.success("Pertandingan Selesai! Skor mencapai 30.");
         // Auto-generate next phase & points
         try {
           const { data: matchesData } = await supabase.from("matches").select("*").eq("tournament_id", targetMatch.tournament_id);
           const { data: teamsData } = await supabase.from("teams").select("*").eq("tournament_id", targetMatch.tournament_id);
           
           if (matchesData && teamsData) {
             const deepestPhase = getCurrentDeepestPhase(matchesData as any);
             if (deepestPhase !== 'F') {
               if (isPhaseComplete(matchesData as any, deepestPhase, teamsData as any)) {
                 const res = await generateNextKnockoutPhase(targetMatch.tournament_id);
                 if (res.success) toast.success(`Jadwal babak ${res.phase} otomatis dibuat!`);
                 else toast.error(res.error || "Gagal membuat jadwal otomatis.");
               }
             }
           }
           const isFinalMatch = targetMatch.phase === "F";
           await autoDistributePoints(supabase, targetMatch.tournament_id, targetMatch.id, isFinalMatch);
         } catch (err) {
           console.error("Auto-generate error", err);
         }
       } else {
         toast.success("Skor diperbarui");
       }

       // Logs
       try {
         const logs = JSON.parse(localStorage.getItem('match_points_logs') || '[]');
         const t1 = targetMatch.teams_team1?.name ?? 'Tim 1';
         const t2 = targetMatch.teams_team2?.name ?? 'Tim 2';
         const teamName = team === 1 ? t1 : t2;
         logs.push({
           id: `log-${Date.now()}`,
           action: `Mengubah skor ${teamName} pada laga "${t1} vs ${t2}" menjadi ${newScore}.`,
           timestamp: new Date().toISOString(),
           type: 'score_change'
         });
         localStorage.setItem('match_points_logs', JSON.stringify(logs.slice(-50)));
       } catch (e) {}
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {matches.map((match, idx) => {
        const t1 = match.teams_team1;
        const t2 = match.teams_team2;

        const tDate = match.tournaments?.start_date ? new Date(match.tournaments.start_date) : null;
        let isToday = false, isPast = false;
        if (tDate) {
          const now = new Date();
          const tDateOnly = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate()).getTime();
          const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          
          if (tDateOnly === nowDateOnly) isToday = true;
          else if (tDateOnly < nowDateOnly) isPast = true;
        }

        const isCompletedDB = match.status === "completed";
        const isCompleted = isCompletedDB || isPast;
        const hasScore = (match.score_team1 || 0) > 0 || (match.score_team2 || 0) > 0;
        const isLive = (!isCompleted && isToday) || (!isCompleted && hasScore) || match.status === "ongoing" || match.status === "in_progress";
        const isScheduled = !isCompleted && !isLive;

        return (
          <div 
            key={match.id}
            className="bg-white dark:bg-gray-900 rounded border border-slate-200 dark:border-gray-800 shadow-xs hover:border-slate-300 dark:hover:border-gray-700 transition duration-150 flex flex-col justify-between overflow-hidden"
          >
            {/* Header card info */}
            <div className="p-4 bg-slate-50/50 dark:bg-gray-800/50 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider bg-indigo-600 block shrink-0 select-none">
                  {match.category || 'Match'}
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 truncate max-w-[120px]">
                  Match {idx + 1}
                </span>
              </div>

              {/* Float Status dropdown / Pill */}
              <div className="flex items-center gap-1">
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider select-none ${
                  isLive
                    ? 'bg-red-50 text-red-600 border border-red-200 animate-pulse'
                    : isCompleted
                    ? 'bg-slate-100 text-slate-700 border border-slate-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {isLive ? 'Berlangsung' : isCompleted ? 'Selesai' : 'Jadwal'}
                </span>
              </div>
            </div>

            {/* Middle: Core Scoreboard */}
            <div className="p-5 flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center justify-between w-full max-w-[280px]">
                
                {/* Team A */}
                <div className="text-center flex-1 min-w-0 pr-2">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate" title={t1?.name ?? "—"}>{t1?.name ?? "—"}</p>
                  <span className="text-[9px] text-slate-400 dark:text-gray-500 uppercase font-bold tracking-widest">TIM 1</span>
                </div>

                {/* Core score display */}
                <div className="flex items-center gap-2 shrink-0">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={match.score_team1 ?? ""}
                    onChange={(e) => handleScoreUpdate(match.id, 1, parseInt(e.target.value) || 0)}
                    className="w-[52px] h-[40px] text-center text-2xl font-bold font-mono text-slate-800 dark:text-white bg-slate-100 dark:bg-gray-800 rounded border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="-"
                  />
                  <span className="text-slate-300 dark:text-gray-600 font-bold text-xs">VS</span>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={match.score_team2 ?? ""}
                    onChange={(e) => handleScoreUpdate(match.id, 2, parseInt(e.target.value) || 0)}
                    className="w-[52px] h-[40px] text-center text-2xl font-bold font-mono text-slate-800 dark:text-white bg-slate-100 dark:bg-gray-800 rounded border border-transparent focus:border-indigo-400 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-700 focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="-"
                  />
                </div>

                {/* Team B */}
                <div className="text-center flex-1 min-w-0 pl-2">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate" title={t2?.name ?? "—"}>{t2?.name ?? "—"}</p>
                  <span className="text-[9px] text-slate-400 dark:text-gray-500 uppercase font-bold tracking-widest">TIM 2</span>
                </div>

              </div>

              {/* Quick Interactive Score Adjuster (Always visible to replace Input Skor Button) */}
              <div className="flex items-center justify-between w-full max-w-[260px] p-2 bg-slate-50 dark:bg-gray-800 border border-slate-150 dark:border-gray-700 rounded-md text-[10px]">
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleScoreUpdate(match.id, 1, (match.score_team1 || 0) - 1)}
                      className="w-5 h-5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-300 rounded flex items-center justify-center font-extrabold cursor-pointer transition"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleScoreUpdate(match.id, 1, (match.score_team1 || 0) + 1)}
                      className="w-5 h-5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-300 rounded flex items-center justify-center font-extrabold cursor-pointer transition"
                    >
                      +
                    </button>
                    <span className="text-slate-400 dark:text-gray-500 self-center ml-1 font-semibold">Skor 1</span>
                  </div>

                  <div className="flex gap-1 justify-end">
                    <span className="text-slate-400 dark:text-gray-500 self-center mr-1 font-semibold">Skor 2</span>
                    <button
                      onClick={() => handleScoreUpdate(match.id, 2, (match.score_team2 || 0) - 1)}
                      className="w-5 h-5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-300 rounded flex items-center justify-center font-extrabold cursor-pointer transition"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleScoreUpdate(match.id, 2, (match.score_team2 || 0) + 1)}
                      className="w-5 h-5 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-gray-600 text-slate-600 dark:text-gray-300 rounded flex items-center justify-center font-extrabold cursor-pointer transition"
                    >
                      +
                    </button>
                  </div>
                </div>
            </div>

            {/* Footer card controls */}
            <div className="p-3 bg-slate-50 dark:bg-gray-800/80 border-t border-slate-100 dark:border-gray-800 flex items-center justify-between text-[10px]">
              <span className="text-slate-400 dark:text-gray-500 font-mono flex items-center gap-1 leading-none select-none">
                <Clock className="w-3.5 h-3.5" />
                {match.tournaments?.start_date ? new Date(match.tournaments.start_date).toLocaleDateString('id-ID') : '--'}
              </span>

              <div className="flex items-center gap-1">
                {onDeleteMatch && (
                  <button
                        onClick={() => onDeleteMatch(match.id)}
                        className="p-1 border border-red-200 text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function MatchTable({ loading, matches, onInputScore, onDeleteMatch }: MatchTableProps) {
  const supabase = createClient();
  const [editingGroupKey, setEditingGroupKey] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [isSavingGroup, setIsSavingGroup] = useState(false);

  const handleEditGroupSubmit = async (tournamentId: string, oldGroupName: string) => {
    if (!editGroupName || editGroupName === oldGroupName) {
      setEditingGroupKey(null);
      return;
    }
    setIsSavingGroup(true);
    try {
      await supabase.from("matches").update({ group_name: editGroupName }).eq("tournament_id", tournamentId).eq("group_name", oldGroupName);
      await supabase.from("teams").update({ group_name: editGroupName }).eq("tournament_id", tournamentId).eq("group_name", oldGroupName);
      
      toast.success("Nama grup berhasil diubah");
      setTimeout(() => window.location.reload(), 500);
    } catch (err: any) {
      toast.error("Gagal mengubah nama grup: " + err.message);
    } finally {
      setIsSavingGroup(false);
      setEditingGroupKey(null);
    }
  };

  if (!loading && matches.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
          <AlertCircle className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">Belum ada jadwal pertandingan</p>
          <p className="text-xs mt-1 text-gray-400 dark:text-gray-600">Selesaikan Spin Wheel lalu klik Generate Jadwal</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <table className="w-full">
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  // Separate matches by phase
  const rrMatches = matches.filter((m) => m.phase === "RR" || !m.phase);
  const sfMatches = matches.filter((m) => m.phase === "SF");
  const finalMatches = matches.filter((m) => m.phase === "F");
  const thirdPlaceMatches = matches.filter((m) => m.phase === "3RD");

  // Grouping helper by tournament
  const groupMatchesByTournament = (phaseMatches: Match[]) => {
    const grouped: Record<string, Match[]> = {};
    phaseMatches.forEach(m => {
      const key = m.tournament_id || "unknown";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    });
    return grouped;
  };

  // Group RR by tournament and group_name
  const rrGrouped: Record<string, Match[]> = {};
  rrMatches.forEach((m) => {
    const key = `${m.tournament_id}|${m.group_name ?? "—"}`;
    if (!rrGrouped[key]) rrGrouped[key] = [];
    rrGrouped[key].push(m);
  });

  const sfGrouped = groupMatchesByTournament(sfMatches);
  const finalGrouped = groupMatchesByTournament(finalMatches);
  const thirdGrouped = groupMatchesByTournament(thirdPlaceMatches);

  return (
    <div className="space-y-6">
      {/* ── Round Robin Groups ────────────────────────────────────────── */}
      {Object.entries(rrGrouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, groupMatches]) => {
          const completed = groupMatches.filter((m) => m.status === "completed").length;
          const groupName = groupMatches[0]?.group_name || "—";
          const tName = groupMatches[0]?.tournaments?.name || "";
          
          return (
            <div
              key={key}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]"
            >
              {/* Group Header */}
              <div className="match-group-header px-5 py-3 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {/* <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-brand-500">
                    {groupName}
                  </div> */}
                  {editingGroupKey === key ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isSavingGroup) handleEditGroupSubmit(groupMatches[0].tournament_id, groupName);
                          if (e.key === "Escape") setEditingGroupKey(null);
                        }}
                        className="px-2 py-1 border border-brand-300 rounded text-sm w-24 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        autoFocus
                        disabled={isSavingGroup}
                      />
                      <button
                        onClick={() => handleEditGroupSubmit(groupMatches[0].tournament_id, groupName)}
                        disabled={isSavingGroup}
                        className="p-1.5 bg-brand-50 text-brand-600 hover:bg-brand-100 rounded transition cursor-pointer"
                        title="Simpan"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2 group cursor-pointer" onClick={() => { setEditingGroupKey(key); setEditGroupName(groupName); }}>
                      Grup {groupName}
                      <Edit2 className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  )}
                  <PhaseBadge phase="RR" />
                </div>
                <div className="flex items-center gap-3 text-right">
                  {tName && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-[150px] md:max-w-[200px]">{tName}</span>}
                  <span className="text-xs text-gray-500 dark:text-gray-400 border-l border-gray-300 dark:border-gray-600 pl-3">
                    {completed}/{groupMatches.length} selesai
                  </span>
                </div>
              </div>

              {/* Matches Grid */}
              <MatchGrid matches={groupMatches} onInputScore={onInputScore} onDeleteMatch={onDeleteMatch} />
            </div>
          );
        })}

      {/* ── Semi Finals ───────────────────────────────────────────────── */}
      {Object.values(sfGrouped).map(tMatches => {
        const completed = tMatches.filter((m) => m.status === "completed").length;
        const tName = tMatches[0]?.tournaments?.name || "";
        const tId = tMatches[0]?.tournament_id || "";
        return (
          <div key={`SF-${tId}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="match-group-header px-5 py-3 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-purple-500">
                  SF
                </div>
                <span className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  Semi Final
                </span>
                <PhaseBadge phase="SF" />
              </div>
              <div className="flex items-center gap-3 text-right">
                {tName && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-[150px] md:max-w-[200px]">{tName}</span>}
                <span className="text-xs text-gray-500 dark:text-gray-400 border-l border-gray-300 dark:border-gray-600 pl-3">
                  {completed}/{tMatches.length} selesai
                </span>
              </div>
            </div>
            {/* Matches Grid */}
            <MatchGrid matches={tMatches} onInputScore={onInputScore} onDeleteMatch={onDeleteMatch} />
          </div>
        )
      })}

      {/* ── 3rd Place ─────────────────────────────────────────────────── */}
      {Object.values(thirdGrouped).map(tMatches => {
        const tName = tMatches[0]?.tournaments?.name || "";
        return (
          <div key={`3RD-${tMatches[0]?.tournament_id}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="match-group-header px-5 py-3 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-orange-500">
                  3
                </div>
                <span className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  Perebutan Juara 3
                </span>
                <PhaseBadge phase="3RD" />
              </div>
              <div className="flex items-center gap-3 text-right">
                {tName && <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate max-w-[150px] md:max-w-[200px]">{tName}</span>}
              </div>
            </div>
            {/* Matches Grid */}
            <MatchGrid matches={tMatches} onInputScore={onInputScore} onDeleteMatch={onDeleteMatch} />
          </div>
        )
      })}

      {/* ── Final ─────────────────────────────────────────────────────── */}
      {Object.values(finalGrouped).map(tMatches => {
        const tName = tMatches[0]?.tournaments?.name || "";
        const tId = tMatches[0]?.tournament_id || "";
        return (
          <div key={`F-${tId}`} className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="match-group-header px-5 py-3 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br from-amber-500 to-yellow-500">
                  🏆
                </div> */}
                <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  Grand Final
                </span>
                <PhaseBadge phase="F" />
              </div>
              <div className="flex items-center gap-3 text-right">
                {tName && <span className="text-xs text-amber-700/80 dark:text-amber-400/80 font-medium truncate max-w-[150px] md:max-w-[200px]">{tName}</span>}
              </div>
            </div>
            {/* Matches Grid */}
            <MatchGrid matches={tMatches} onInputScore={onInputScore} onDeleteMatch={onDeleteMatch} />
          </div>
        )
      })}
    </div>
  );
}
