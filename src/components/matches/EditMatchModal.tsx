"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import { X, Edit, Save, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { CATEGORY_OPTIONS, type Match } from "@/components/matches/MatchTable";

interface Team {
  id: string;
  name: string;
}

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  match: Match | null;
}

export default function EditMatchModal({ isOpen, onClose, onSaved, match }: EditMatchModalProps) {
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [formData, setFormData] = useState({
    phase: "",
    group_name: "",
    team1_id: "",
    team2_id: "",
    status: "",
  });

  useEffect(() => {
    setMounted(true);
    if (isOpen && match) {
      setFormData({
        phase: match.phase || "RR",
        group_name: match.group_name || "",
        team1_id: match.team1_id || "",
        team2_id: match.team2_id || "",
        status: match.status || "scheduled",
      });
      fetchTeams(match.tournament_id);
    }
  }, [isOpen, match]);

  const fetchTeams = async (tournamentId: string) => {
    const { data, error } = await supabase
      .from("teams")
      .select("id, name")
      .eq("tournament_id", tournamentId)
      .order("name");
    
    if (!error && data) {
      setTeams(data);
    }
  };

  const handleSave = async () => {
    if (!match) return;
    
    if (formData.team1_id && formData.team2_id && formData.team1_id === formData.team2_id) {
      toast.error("Tim 1 dan Tim 2 tidak boleh sama!");
      return;
    }

    setSaving(true);
    
    const { error } = await supabase
      .from("matches")
      .update({
        phase: formData.phase,
        group_name: formData.group_name || null,
        team1_id: formData.team1_id || null,
        team2_id: formData.team2_id || null,
        status: formData.status,
      })
      .eq("id", match.id);

    setSaving(false);

    if (error) {
      toast.error("Gagal mengupdate jadwal: " + error.message);
    } else {
      toast.success("Jadwal berhasil diupdate!");
      onSaved();
      onClose();
    }
  };

  if (!mounted || !isOpen || !match) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div 
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col transform transition-all border border-gray-100 dark:border-gray-800"
        role="dialog"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center flex-shrink-0">
              <Edit className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Jadwal Pertandingan</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Update detail jadwal</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="scheduled">Dijadwalkan</option>
              <option value="ongoing">Berlangsung</option>
              <option value="completed">Selesai</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Phase */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Babak/Fase</label>
              <select
                value={formData.phase}
                onChange={(e) => {
                  setFormData({ 
                    ...formData, 
                    phase: e.target.value,
                    group_name: e.target.value !== "RR" ? "" : formData.group_name 
                  });
                }}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              >
                <option value="RR">Round Robin (Grup)</option>
                <option value="SF">Semi Final</option>
                <option value="3RD">Juara 3</option>
                <option value="F">Final</option>
              </select>
            </div>
            
            {/* Group (Optional, only if RR) */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nama Grup <span className="text-gray-400 font-normal">(Untuk RR)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: A"
                maxLength={2}
                value={formData.group_name}
                onChange={(e) => setFormData({ ...formData, group_name: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 uppercase"
                disabled={formData.phase !== "RR"}
              />
            </div>
          </div>



          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="w-full">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tim 1</label>
                <select
                  value={formData.team1_id}
                  onChange={(e) => setFormData({ ...formData, team1_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  <option value="">Kosong</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3 font-bold text-gray-400 dark:text-gray-500 text-sm">VS</div>
              
              <div className="w-full">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tim 2</label>
                <select
                  value={formData.team2_id}
                  onChange={(e) => setFormData({ ...formData, team2_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
                >
                  <option value="">Kosong</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
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
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
