"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { X, Save, Loader2, Trophy, Swords } from "lucide-react";
import { toast } from "react-toastify";
import {
  isAllRRComplete, hasKnockoutPhase, generateSemiFinals,
  isSFComplete, hasFinalPhase, generateFinal
} from "@/lib/utils/knockout-engine";

import { autoDistributePoints } from "@/lib/actions/point";

interface Team {
  id: string;
  name: string;
  is_bye_team: boolean;
}

interface Match {
  id: string;
  tournament_id: string;
  phase: string;
  group_name: string | null;
  round_number: number | null;
  match_number: number | null;
  status: string | null;
  score_team1: number | null;
  score_team2: number | null;
  winner_team_id: string | null;
  is_bye: boolean | null;
  team1_id: string | null;
  team2_id: string | null;
  teams_team1?: Team | null;
  teams_team2?: Team | null;
}

interface ScoreInputModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function ScoreInputModal({ match, isOpen, onClose, onSaved }: ScoreInputModalProps) {
  const supabase = createClient();
  const [score1, setScore1] = useState("");
  const [score2, setScore2] = useState("");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleScoreChange = (val: string, setter: (v: string) => void) => {
    if (val === "") { setter(""); return; }
    const n = parseInt(val);
    if (isNaN(n) || n < 0) return;
    setter(String(Math.min(n, 30)));
  };

  const stepScore = (current: string, delta: number, setter: (v: string) => void) => {
    const cur = current === "" ? 0 : parseInt(current);
    const next = Math.min(30, Math.max(0, cur + delta));
    setter(String(next));
  };

  useEffect(() => {
    if (match) {
      setScore1(match.score_team1?.toString() ?? "");
      setScore2(match.score_team2?.toString() ?? "");
    }
  }, [match]);

  const handleSave = useCallback(async () => {
    if (!match) return;
    const s1 = parseInt(score1);
    const s2 = parseInt(score2);
    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      toast.error("Skor harus berupa angka positif");
      return;
    }

    setSaving(true);
    const winnerId =
      s1 > s2 ? match.team1_id : s2 > s1 ? match.team2_id : null;

    const { error } = await supabase
      .from("matches")
      .update({
        score_team1: s1,
        score_team2: s2,
        winner_team_id: winnerId,
        status: "completed",
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", match.id);

    setSaving(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Skor berhasil disimpan!");

      // ── Auto-generate Knockout Logic ──
      try {
        const { data: matchesData } = await supabase.from("matches").select("*").eq("tournament_id", match.tournament_id);
        const { data: teamsData } = await supabase.from("teams").select("*").eq("tournament_id", match.tournament_id);
        
        const allMatches = matchesData || [];
        const allTeams = teamsData || [];

        if (match.phase === "RR" || !match.phase) {
          if (isAllRRComplete(allMatches as any, allTeams as any) && !hasKnockoutPhase(allMatches as any)) {
            const res = await generateSemiFinals(match.tournament_id);
            if (res.success) toast.success(`Jadwal ${res.phase === 'F' ? 'Final' : 'Semi Final'} otomatis dibuat!`);
            else toast.error(res.error || "Gagal membuat jadwal otomatis.");
          }
        } else if (match.phase === "SF") {
          if (isSFComplete(allMatches as any) && !hasFinalPhase(allMatches as any)) {
            const res = await generateFinal(match.tournament_id);
            if (res.success) toast.success("Jadwal Final & Juara 3 otomatis dibuat!");
            else toast.error(res.error || "Gagal membuat jadwal Final otomatis.");
          }
        }

        // ── Auto-distribute Points ──
        await autoDistributePoints(supabase, match.tournament_id, match.id);

      } catch (err) {
        console.error("Auto-generate error", err);
      }

      onSaved();
      onClose();
    }
  }, [match, score1, score2, supabase, onSaved, onClose]);

  if (!isOpen || !match || !mounted) return null;

  const team1Name = match.teams_team1?.name ?? "Tim 1";
  const team2Name = match.teams_team2?.name ?? "Tim 2";

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-brand-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
              Input Skor — Grup {match.group_name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          <div className="flex items-center gap-4">
            {/* Team 1 Score */}
            <div className="flex-1 text-center">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 truncate" title={team1Name}>
                {team1Name}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => stepScore(score1, -1, setScore1)}
                  className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-xl font-bold flex items-center justify-center transition-colors select-none shrink-0"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={score1}
                  onChange={(e) => handleScoreChange(e.target.value, setScore1)}
                  className="w-full text-center text-3xl font-bold py-3 px-1 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => stepScore(score1, 1, setScore1)}
                  className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-xl font-bold flex items-center justify-center transition-colors select-none shrink-0"
                >
                  +
                </button>
              </div>
            </div>

            {/* VS */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <span className="text-lg font-bold text-gray-400 dark:text-gray-600">VS</span>
            </div>

            {/* Team 2 Score */}
            <div className="flex-1 text-center">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 truncate" title={team2Name}>
                {team2Name}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => stepScore(score2, -1, setScore2)}
                  className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-xl font-bold flex items-center justify-center transition-colors select-none shrink-0"
                >
                  −
                </button>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={score2}
                  onChange={(e) => handleScoreChange(e.target.value, setScore2)}
                  className="w-full text-center text-3xl font-bold py-3 px-1 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => stepScore(score2, 1, setScore2)}
                  className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 text-xl font-bold flex items-center justify-center transition-colors select-none shrink-0"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Preview pemenang */}
          {score1 !== "" && score2 !== "" && parseInt(score1) !== parseInt(score2) && (
            <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <Trophy className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                Menang: {parseInt(score1) > parseInt(score2) ? team1Name : team2Name}
              </span>
            </div>
          )}

          {score1 !== "" && score2 !== "" && parseInt(score1) === parseInt(score2) && (
            <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                Seri — tidak ada pemenang
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3 justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={saving || score1 === "" || score2 === ""}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
