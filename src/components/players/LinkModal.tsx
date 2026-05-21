import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link2, Link2Off, Loader2, UserCheck } from "lucide-react";
import { Player } from "@/app/admin/players/types";
import Loader from "@/components/shared/Loader";

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onSaved: () => void;
}

export default function LinkModal({ isOpen, onClose, player, onSaved }: LinkModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
      setSelectedProfileId(player?.profile_id || "");
    }
  }, [isOpen, player]);

  const fetchProfiles = async () => {
    const { data: profilesData } = await supabase.from("profiles").select("id, full_name, email");
    const { data: linkedPlayers } = await supabase.from("players")
      .select("profile_id")
      .not("profile_id", "is", null);

    const linkedIds = linkedPlayers?.map(p => p.profile_id) || [];
    const available = profilesData?.filter(p =>
      !linkedIds.includes(p.id) || p.id === player?.profile_id
    ) || [];

    setProfiles(available);
  };

  const handleSave = async () => {
    if (!player) return;
    setLoading(true);

    try {
      if (selectedProfileId) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, email, phone, avatar_url, address, gender")
          .eq("id", selectedProfileId)
          .single();

        if (profileData) {
          await supabase
            .from("players")
            .update({
              profile_id: selectedProfileId,
              full_name: profileData.full_name,
              email: profileData.email,
              phone: profileData.phone,
              avatar_url: profileData.avatar_url,
              address: profileData.address,
              gender: profileData.gender as any
            })
            .eq("id", player.id);
        }
      } else {
        await supabase.from("players").update({ profile_id: null }).eq("id", player.id);
      }
    } catch (error) {
      console.error("Error linking profile:", error);
    } finally {
      setLoading(false);
      onSaved();
      onClose();
    }
  };

  const handleUnlink = async () => {
    if (!player) return;
    setLoading(true);
    await supabase.from("players").update({ profile_id: null }).eq("id", player.id);
    setLoading(false);
    onSaved();
    onClose();
  };

  if (!isOpen || !player) return null;

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
          <Loader />
        </div>
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative z-10 w-full max-w-md mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-brand-500" />
            Tautkan Akun User
          </h2>

          {player.profile_id ? (
            <div className="mb-6 p-4 rounded-xl border border-green-200 bg-green-50 dark:bg-green-500/10 dark:border-green-800">
              <div className="flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-green-600 dark:text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-green-800 dark:text-green-400 font-medium mb-1">
                    Pemain ini sudah ditautkan dengan sebuah akun.
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500 break-all">
                    Profile ID: {player.profile_id}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pilih Akun User
              </label>
              <select
                value={selectedProfileId}
                onChange={(e) => setSelectedProfileId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
              >
                <option value="">-- Tidak ditautkan --</option>
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name || p.email || p.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Batal
            </button>
            {player.profile_id ? (
              <button
                onClick={handleUnlink}
                disabled={loading}
                type="button"
                className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2Off className="w-4 h-4" />}
                {loading ? "Melepas..." : "Lepas Tautan"}
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={loading}
                type="button"
                className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {loading ? "Menyimpan..." : "Simpan Tautan"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
