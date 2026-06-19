"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ParticipantFormData,
  INITIAL_FORM,
  ParticipantStatus,
  STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from "@/app/admin/participant/types";
import Label from "@/components/form/Label";
import {
  Users,
  FileText,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Trophy,
} from "lucide-react";

interface ParticipantFormProps {
  participantId?: string;
  defaultTournamentId?: string;
}

type NotifType = "success" | "error";
interface Notif { type: NotifType; message: string }

const FIELD_CLASS =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-shadow";

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  subtitle,
  iconBg = "bg-brand-50 dark:bg-brand-500/10",
  iconColor = "text-brand-600 dark:text-brand-400",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  iconBg?: string;
  iconColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
      <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h2>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export default function ParticipantForm({ participantId, defaultTournamentId }: ParticipantFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!participantId;

  const [form, setForm] = useState<ParticipantFormData>({
    ...INITIAL_FORM,
    tournament_id: defaultTournamentId || "",
  });
  const [tournaments, setTournaments] = useState<{ id: string; name: string; status: string; gender_category?: string }[]>([]);
  const [profiles, setprofiles] = useState<{ id: string; fullname: string; gender?: string | null }[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notif, setNotif] = useState<Notif | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ParticipantFormData, string>>>({});
  const [existingParticipantIds, setExistingParticipantIds] = useState<Set<string>>(new Set());

  // ─── Fetch dropdowns & existing data ──────────────────────────────────────

  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      
      let tQuery = supabase.from("tournaments").select("id, name, status, gender_category").order("start_date", { ascending: false });
      
      if (isEdit) {
        // Edit mode: exclude cancelled
        tQuery = tQuery.neq("status", "cancelled");
      } else {
        // Add mode: upcoming, registration, and ongoing (today/future)
        tQuery = tQuery.in("status", ["upcoming", "registration", "ongoing"]);
      }

      const [tRes, pRes] = await Promise.all([
        tQuery,
        supabase.from("profile").select("id, fullname, gender").eq("is_active", true).order("fullname"),
      ]);
      
      setTournaments(tRes.data || []);
      setprofiles(pRes.data || []);

      if (isEdit) {
        const { data } = await supabase
          .from("tournament_participants")
          .select("*")
          .eq("id", participantId)
          .single();
        
        if (data) {
          setForm({
            tournament_id: data.tournament_id ?? "",
            profile_id: data.profile_id ?? "",
            profile_ids: [],
            status: data.status || "registered",
            payment_status: data.payment_status || "unpaid",
            notes: data.notes ?? "",
          });
        }
      }
      setLoadingData(false);
    }
    loadData();
  }, [participantId, isEdit, supabase]);

  useEffect(() => {
    if (!form.tournament_id || isEdit) {
      setExistingParticipantIds(new Set());
      return;
    }
    supabase.from("tournament_participants")
      .select("profile_id")
      .eq("tournament_id", form.tournament_id)
      .then(({ data }) => {
        if (data) {
          setExistingParticipantIds(new Set(data.map(d => d.profile_id).filter(Boolean) as string[]));
        }
      });
  }, [form.tournament_id, isEdit, supabase]);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function showNotif(type: NotifType, message: string) {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 4000);
  }

  function setField<K extends keyof ParticipantFormData>(key: K, value: ParticipantFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function toggleProfile(profileId: string) {
    setForm((prev) => {
      const ids = prev.profile_ids || [];
      if (ids.includes(profileId)) {
        return { ...prev, profile_ids: ids.filter((id) => id !== profileId) };
      } else {
        return { ...prev, profile_ids: [...ids, profileId] };
      }
    });
    setErrors((prev) => ({ ...prev, profile_ids: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof ParticipantFormData, string>> = {};
    if (!form.tournament_id) newErrors.tournament_id = "Pilih turnamen";
    if (isEdit) {
      if (!form.profile_id) newErrors.profile_id = "Pilih pemain";
    } else {
      if (!form.profile_ids || form.profile_ids.length === 0) newErrors.profile_ids = "Pilih minimal 1 pemain";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      showNotif("error", "Mohon lengkapi kolom yang wajib diisi");
      return;
    }

    setSaving(true);

    let error = null;
    if (isEdit) {
      const payload = {
        tournament_id: form.tournament_id,
        profile_id: form.profile_id,
        status: form.status,
        payment_status: form.payment_status,
        notes: form.notes.trim() || null,
      };

      const res = await supabase
        .from("tournament_participants")
        .update(payload)
        .eq("id", participantId!);
      error = res.error;
    } else {
      const payloads = form.profile_ids.map((id) => ({
        tournament_id: form.tournament_id,
        profile_id: id,
        status: form.status,
        payment_status: form.payment_status,
        notes: form.notes.trim() || null,
        registered_at: new Date().toISOString(),
      }));

      const res = await supabase.from("tournament_participants").insert(payloads);
      error = res.error;
    }

    setSaving(false);

    if (error) {
      const msg = error.message.includes("unique") || error.message.includes("duplicate")
        ? "Pemain sudah terdaftar di turnamen ini"
        : error.message;
      showNotif("error", "Gagal menyimpan: " + msg);
      return;
    }

    showNotif(
      "success",
      isEdit ? "Peserta berhasil diperbarui!" : "Peserta berhasil ditambahkan!"
    );

    try {
      const actionText = isEdit 
        ? `Memperbarui data peserta di turnamen` 
        : `Mendaftarkan ${form.profile_ids.length} peserta baru ke turnamen`;
      const type = isEdit ? 'update' : 'create';
      const storedLogs = JSON.parse(localStorage.getItem('manajemen_peserta_logs') || '[]');
      const newLog = {
        id: `log-${Date.now()}`,
        action: actionText,
        timestamp: new Date().toISOString(),
        type
      };
      localStorage.setItem('manajemen_peserta_logs', JSON.stringify([...storedLogs, newLog].slice(-50)));
    } catch (err) {}

    setTimeout(() => router.push("/admin/participant"), 1000);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const selectedTournamentData = tournaments.find(t => t.id === form.tournament_id);
  const tournamentGender = selectedTournamentData?.gender_category;
  const filteredprofiles = profiles.filter(p => {
    if (!form.tournament_id) return true;
    if (!tournamentGender || tournamentGender === 'campuran') return true;
    if (tournamentGender === 'putra') return p.gender === 'male';
    if (tournamentGender === 'putri') return p.gender === 'female';
    return true;
  });

  return (
    <>
      {/* Notification */}
      {notif && (
        <div
          className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
            notif.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
          }`}
        >
          {notif.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {notif.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── 1. Informasi Peserta ─────────────────────────────────────────── */}
        <SectionCard
          icon={<Users className="w-4 h-4" />}
          title="Informasi Peserta"
          subtitle="Pilih turnamen dan pemain yang didaftarkan"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Turnamen */}
            <div>
              <Label htmlFor="tournament_id">
                Turnamen <span className="text-red-500">*</span>
              </Label>
              <select
                id="tournament_id"
                value={form.tournament_id}
                onChange={(e) => setField("tournament_id", e.target.value)}
                className={FIELD_CLASS}
              >
                <option value="">-- Pilih turnamen --</option>
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {errors.tournament_id && <p className="mt-1.5 text-xs text-red-500">{errors.tournament_id}</p>}
            </div>

            {/* Pemain */}
            <div>
              <Label htmlFor="profile_id">
                Pemain <span className="text-red-500">*</span>
              </Label>
              {isEdit ? (
                <select
                  id="profile_id"
                  value={form.profile_id}
                  onChange={(e) => setField("profile_id", e.target.value)}
                  className={FIELD_CLASS}
                  disabled={true}
                >
                  <option value="">-- Pilih pemain --</option>
                  {filteredprofiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullname}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="space-y-2">
                  <select
                    id="player_add"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) toggleProfile(e.target.value);
                    }}
                    className={FIELD_CLASS}
                    disabled={!form.tournament_id}
                  >
                    <option value="">{form.tournament_id ? "-- Tambah pemain --" : "-- Pilih turnamen terlebih dahulu --"}</option>
                    {filteredprofiles.map((p) => {
                      const isJoined = existingParticipantIds.has(p.id);
                      const isSelected = (form.profile_ids || []).includes(p.id);
                      return (
                        <option key={p.id} value={p.id} disabled={isJoined || isSelected}>
                          {p.fullname} {isJoined ? "(Sudah Bergabung)" : isSelected ? "(Terpilih)" : ""}
                        </option>
                      );
                    })}
                  </select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(form.profile_ids || []).map((id) => {
                      const p = profiles.find((x) => x.id === id);
                      if (!p) return null;
                      return (
                        <div key={id} className="flex items-center gap-1.5 bg-brand-50 border border-brand-200 dark:bg-brand-500/10 dark:border-brand-500/20 text-brand-700 dark:text-brand-400 px-2.5 py-1 rounded-lg text-sm">
                          <span>{p.fullname}</span>
                          <button
                            type="button"
                            onClick={() => toggleProfile(id)}
                            className="text-brand-500 hover:text-brand-700 dark:hover:text-brand-300 ml-1"
                          >
                            &times;
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {errors.profile_id && <p className="mt-1.5 text-xs text-red-500">{errors.profile_id}</p>}
              {errors.profile_ids && <p className="mt-1.5 text-xs text-red-500">{errors.profile_ids}</p>}
            </div>
          </div>
        </SectionCard>

        {/* ── 2. Status & Pembayaran ────────────────────────────────────────── */}
        <SectionCard
          icon={<DollarSign className="w-4 h-4" />}
          title="Status & Pembayaran"
          subtitle="Status kepesertaan dan info pembayaran"
          iconBg="bg-sky-50 dark:bg-sky-500/10"
          iconColor="text-sky-600 dark:text-sky-400"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Status Peserta */}
            <div>
              <Label htmlFor="status">
                Status Kepesertaan <span className="text-red-500">*</span>
              </Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setField("status", e.target.value as ParticipantStatus)}
                className={FIELD_CLASS}
              >
                {(Object.keys(STATUS_CONFIG) as ParticipantStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Pembayaran */}
            <div>
              <Label htmlFor="payment_status">
                Status Pembayaran <span className="text-red-500">*</span>
              </Label>
              <select
                id="payment_status"
                value={form.payment_status}
                onChange={(e) => setField("payment_status", e.target.value)}
                className={FIELD_CLASS}
              >
                {Object.keys(PAYMENT_STATUS_CONFIG).map((s) => (
                  <option key={s} value={s}>
                    {PAYMENT_STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Deskripsi/Catatan */}
            <div className="md:col-span-2">
              <Label htmlFor="notes">Catatan Tambahan</Label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Misal: Sudah bayar via transfer Mandiri an. Budi..."
                rows={3}
                className={`${FIELD_CLASS} resize-none`}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>

          <button
            type="submit"
            id="btn-submit-participant"
            disabled={saving || loadingData}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </>
  );
}
