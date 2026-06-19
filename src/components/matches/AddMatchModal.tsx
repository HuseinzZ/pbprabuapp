"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, CalendarPlus, Save, AlertCircle, Loader2, Users } from "lucide-react";
import { toast } from "react-toastify";
import { CATEGORY_OPTIONS } from "@/components/matches/MatchTable";
import MultiSelect from "@/components/form/MultiSelect";

interface Tournament {
  id: string;
  name: string;
  match_format?: string;
  gender_category?: string;
}

interface Team {
  id: string;
  name: string;
}

interface AddMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddMatchModal({ isOpen, onClose, onSaved }: AddMatchModalProps) {
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [formData, setFormData] = useState<{
    tournament_id: string;
    phase: string;
    group_name: string;
    category: string;
    matchPairs: { team1_id: string; team2_id: string }[];
  }>({
    tournament_id: "",
    phase: "RR",
    group_name: "",
    category: "",
    matchPairs: [{ team1_id: "", team2_id: "" }],
  });

  const [generatingTeams, setGeneratingTeams] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      fetchTournaments();
    }
  }, [isOpen]);

  const getCategoryFromTournament = (t: Tournament) => {
    if (t.match_format && t.gender_category) {
      return `${t.match_format}_${t.gender_category}`;
    }
    return "";
  };

  useEffect(() => {
    if (formData.tournament_id) {
      fetchTeams(formData.tournament_id);
      const t = tournaments.find(t => t.id === formData.tournament_id);
      if (t) {
        setFormData(prev => ({ ...prev, category: getCategoryFromTournament(t) }));
      }
    } else {
      setTeams([]);
      setFormData(prev => ({ ...prev, matchPairs: [{ team1_id: "", team2_id: "" }] }));
    }
  }, [formData.tournament_id, tournaments]);

  const fetchTournaments = async () => {
    const { data, error } = await supabase
      .from("tournaments")
      .select("id, name, match_format, gender_category")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Gagal mengambil data turnamen");
    } else if (data) {
      setTournaments(data);
      if (data.length > 0 && !formData.tournament_id) {
        setFormData(prev => ({ ...prev, tournament_id: data[0].id }));
      }
    }
  };

  const fetchTeams = async (tournamentId: string) => {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name")
      .eq("tournament_id", tournamentId)
      .order("name", { ascending: true });
      
    if (error) {
      toast.error("Gagal mengambil data tim");
    } else if (data) {
      setTeams(data);
    }
  };

  const getCombinations = (array: string[]) => {
    const result: [string, string][] = [];
    for (let i = 0; i < array.length; i++) {
      for (let j = i + 1; j < array.length; j++) {
        result.push([array[i], array[j]]);
      }
    }
    return result;
  };

  const handleSave = async () => {
    // Validate all pairs
    const invalidPair = formData.matchPairs.find(p => !p.team1_id || !p.team2_id);
    if (!formData.tournament_id || !formData.phase || invalidPair) {
      toast.error("Mohon lengkapi semua baris Tim 1 dan Tim 2");
      return;
    }

    const sameTeamPair = formData.matchPairs.find(p => p.team1_id === p.team2_id);
    if (sameTeamPair) {
      toast.error("Tim 1 dan Tim 2 tidak boleh sama dalam satu pertandingan");
      return;
    }

    setSaving(true);
    
    // get match number count for this phase & group
    let query = supabase
      .from("matches")
      .select("match_number", { count: "exact" })
      .eq("tournament_id", formData.tournament_id)
      .eq("phase", formData.phase);
      
    if (formData.phase === "RR" && formData.group_name) {
      query = query.eq("group_name", formData.group_name);
    }
    
    const { data: countData } = await query;
    let nextMatchNumber = (countData?.length || 0) + 1;

    const newMatches = formData.matchPairs.map((pair) => ({
      tournament_id: formData.tournament_id,
      phase: formData.phase,
      group_name: formData.phase === "RR" ? formData.group_name.toUpperCase() : null,
      category: formData.category || null,
      team1_id: pair.team1_id,
      team2_id: pair.team2_id,
      match_number: nextMatchNumber++,
      status: "scheduled",
    }));

    const { error } = await supabase
      .from("matches")
      .insert(newMatches);

    setSaving(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${newMatches.length} Jadwal berhasil ditambahkan!`);
      onSaved();
      onClose();
      // Reset form
      setFormData({
        tournament_id: formData.tournament_id,
        phase: "RR",
        group_name: "",
        category: "",
        matchPairs: [{ team1_id: "", team2_id: "" }],
      });
    }
  };

  const handleGenerateSingleTeams = async () => {
    if (!formData.tournament_id) return;
    setGeneratingTeams(true);
    try {
      // 1. Fetch participants
      const { data: participants, error: pErr } = await supabase
        .from("tournament_participants")
        .select("id, profile_id, profile(fullname)")
        .eq("tournament_id", formData.tournament_id)
        .eq("status", "confirmed");

      if (pErr) throw pErr;
      if (!participants || participants.length === 0) {
        toast.error("Tidak ada peserta terkonfirmasi di turnamen ini.");
        setGeneratingTeams(false);
        return;
      }

      // 2. Insert into teams (1 player = 1 team)
      const teamInserts = participants.map((p, i) => ({
        tournament_id: formData.tournament_id,
        name: (p.profile as any)?.fullname || `Pemain ${i + 1}`,
        player1_id: p.profile_id,
        is_bye_team: false,
        group_name: "A",
        group_position: i + 1
      }));

      const { error: tErr } = await supabase.from("teams").insert(teamInserts);
      if (tErr) throw tErr;

      toast.success(`${teamInserts.length} Tim berhasil dibentuk dari peserta!`);
      // 3. Refetch teams
      await fetchTeams(formData.tournament_id);
    } catch (err: any) {
      toast.error("Gagal membentuk tim: " + err.message);
    } finally {
      setGeneratingTeams(false);
    }
  };

  const addMatchPair = () => {
    setFormData(prev => ({
      ...prev,
      matchPairs: [...prev.matchPairs, { team1_id: "", team2_id: "" }]
    }));
  };

  const removeMatchPair = (index: number) => {
    setFormData(prev => ({
      ...prev,
      matchPairs: prev.matchPairs.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-brand-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
              Tambah Jadwal Pertandingan
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
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 custom-scrollbar">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Turnamen</label>
            <select
              value={formData.tournament_id}
              onChange={(e) => setFormData({ ...formData, tournament_id: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="">Pilih Turnamen</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fase</label>
              <select
                value={formData.phase}
                onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              >
                <option value="RR">Round Robin (Grup)</option>
                <option value="QF">Perempat Final</option>
                <option value="SF">Semi Final</option>
                <option value="3RD">Perebutan Juara 3</option>
                <option value="F">Final</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nama Grup (Opsional)</label>
              <input
                type="text"
                placeholder="Misal: A"
                value={formData.group_name}
                onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 uppercase"
                disabled={formData.phase !== "RR"}
              />
            </div>
          </div>

          {/* Kategori Pertandingan */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Kategori Pertandingan
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: "" })}
                className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                  formData.category === ""
                    ? "border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                }`}
              >
                Umum
              </button>
              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: opt.value })}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    formData.category === opt.value
                      ? opt.value.includes("putra") && !opt.value.includes("campuran")
                        ? "border-blue-400 bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                        : opt.value === "ganda_campuran"
                        ? "border-violet-400 bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300"
                        : "border-pink-400 bg-pink-50 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>


          {formData.tournament_id && teams.length === 0 ? (
            <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
              <p className="text-sm text-amber-800 dark:text-amber-400 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Belum ada tim yang terbentuk untuk turnamen ini!
              </p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-1 pl-6">
                Untuk turnamen ganda, silakan masuk ke menu <strong>Spin Wheel</strong> untuk mengundi tim. <br/>
                Jika ini turnamen tunggal (1 Pemain = 1 Tim), Anda dapat membentuk tim otomatis sekarang.
              </p>
              <div className="pl-6 mt-3">
                <button
                  type="button"
                  onClick={handleGenerateSingleTeams}
                  disabled={generatingTeams}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-medium transition-colors"
                >
                  {generatingTeams ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                  Bentuk Tim dari Peserta
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
            {formData.matchPairs.map((pair, index) => (
              <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] items-end gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="w-full">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tim 1</label>
                  <select
                    value={pair.team1_id}
                    onChange={(e) => {
                      const newPairs = [...formData.matchPairs];
                      newPairs[index].team1_id = e.target.value;
                      setFormData({ ...formData, matchPairs: newPairs });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  >
                    <option value="">Pilih Tim 1</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-3 font-bold text-gray-400 dark:text-gray-500 text-sm">VS</div>
                
                <div className="w-full">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tim 2</label>
                  <select
                    value={pair.team2_id}
                    onChange={(e) => {
                      const newPairs = [...formData.matchPairs];
                      newPairs[index].team2_id = e.target.value;
                      setFormData({ ...formData, matchPairs: newPairs });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                  >
                    <option value="">Pilih Tim 2</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {formData.matchPairs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMatchPair(index)}
                    className="mb-1 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            
            <button
              type="button"
              onClick={addMatchPair}
              className="mt-2 text-xs font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 inline-flex items-center gap-1.5 transition-colors"
            >
              + Tambah Tim 1/2
            </button>
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
            disabled={saving || !formData.tournament_id || formData.matchPairs.some(p => !p.team1_id || !p.team2_id)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Jadwal
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
