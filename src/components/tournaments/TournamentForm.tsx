"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Tournament,
  TournamentFormData,
  TournamentStatus,
  INITIAL_FORM,
  STATUS_CONFIG,
} from "@/app/admin/tournaments/types";
import { Point } from "@/app/admin/points/types";
import Loader from "@/components/shared/Loader";
import Label from "@/components/form/Label";

import DatePicker from "@/components/form/DatePicker";
import {
  Trophy,
  MapPin,
  CalendarDays,
  Users,
  DollarSign,
  FileText,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  Swords,
  Info,
} from "lucide-react";

interface TournamentFormProps {
  tournamentId?: string;
}

type NotifType = "success" | "error";
interface Notif { type: NotifType; message: string }

const FIELD_CLASS =
  "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500 dark:focus:border-brand-500 transition-all disabled:opacity-50";

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

export default function TournamentForm({ tournamentId }: TournamentFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!tournamentId;

  const [form, setForm] = useState<TournamentFormData>(INITIAL_FORM);
  const [tournamentTypes, setPoints] = useState<Point[]>([]);
  const [loadingData, setLoadingData] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [notif, setNotif] = useState<Notif | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof TournamentFormData, string>>>({});

  // ─── Fetch tournament types ───────────────────────────────────────────────

  useEffect(() => {
    supabase
      .from("points")
      .select("*")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => setPoints((data as Point[]) ?? []));
  }, []);

  // ─── Fetch existing tournament for edit ───────────────────────────────────

  useEffect(() => {
    if (!tournamentId) return;
    setLoadingData(true);
    supabase
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single()
      .then(({ data }) => {
        if (data) {
          const t = data as Tournament;
          setForm({
            points_id: t.points_id ?? "",
            name: t.name,
            description: t.description ?? "",
            location: t.location ?? "",
            start_date: t.start_date,
            registration_deadline: t.registration_deadline ?? "",
            max_participants: t.max_participants?.toString() ?? "",
            entry_fee: t.entry_fee === 0 ? "" : t.entry_fee?.toString() ?? "",
            prize_pool: t.prize_pool === 0 ? "" : t.prize_pool?.toString() ?? "",
            status: t.status,
            match_format: (t.match_format as 'tunggal' | 'ganda') ?? 'ganda',
            gender_category: (t.gender_category as 'putra' | 'putri' | 'campuran') ?? 'campuran',
            rules: t.rules ?? "",
          });
        }
        setLoadingData(false);
      });
  }, [tournamentId]);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  function showNotif(type: NotifType, message: string) {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 4000);
  }

  function setField<K extends keyof TournamentFormData>(key: K, value: TournamentFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof TournamentFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = "Nama turnamen wajib diisi";
    if (!form.start_date) newErrors.start_date = "Tanggal mulai wajib diisi";
    if (
      form.registration_deadline &&
      form.start_date &&
      form.registration_deadline > form.start_date
    ) {
      newErrors.registration_deadline = "Deadline pendaftaran harus sebelum tanggal mulai";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      showNotif("error", "Mohon perbaiki kesalahan pada formulir");
      return;
    }

    setSaving(true);

    const payload = {
      points_id: form.points_id || null,
      name: form.name.trim(),
      description: form.description.trim() || null,
      location: form.location.trim() || null,
      start_date: form.start_date,
      registration_deadline: form.registration_deadline || null,
      max_participants: form.max_participants ? Number(form.max_participants) : null,
      entry_fee: Number(form.entry_fee) || 0,
      prize_pool: Number(form.prize_pool) || 0,
      status: form.status,
      match_format: form.match_format,
      gender_category: form.gender_category,
      rules: form.rules.trim() || null,
    };

    let error = null;
    if (isEdit) {
      const res = await supabase
        .from("tournaments")
        .update(payload)
        .eq("id", tournamentId!);
      error = res.error;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      let createdBy = null;
      
      if (user?.id) {
        // Cek apakah profile admin ada untuk mencegah FK error
        const { data: profile } = await supabase
          .from("profile")
          .select("id")
          .eq("id", user.id)
          .single();
          
        if (profile) {
          createdBy = user.id;
        }
      }

      const insertPayload = {
        ...payload,
        created_by: createdBy
      };
      const res = await supabase.from("tournaments").insert(insertPayload);
      error = res.error;
    }

    setSaving(false);

    if (error) {
      showNotif("error", "Gagal menyimpan: " + error.message);
      return;
    }

    try {
      const logsStr = localStorage.getItem('manajemen_turnamen_logs');
      const prevLogs = logsStr ? JSON.parse(logsStr) : [];
      const newLog = {
        id: `log-${Date.now()}`,
        action: isEdit ? `Memperbarui turnamen "${payload.name}"` : `Menambahkan turnamen baru "${payload.name}"`,
        timestamp: new Date().toISOString(),
        type: isEdit ? 'update' : 'create'
      };
      localStorage.setItem('manajemen_turnamen_logs', JSON.stringify([...prevLogs, newLog].slice(-50)));
    } catch (e) {
      console.error("Gagal menyimpan log:", e);
    }

    showNotif(
      "success",
      isEdit ? "Turnamen berhasil diperbarui!" : "Turnamen baru berhasil ditambahkan!"
    );
    setTimeout(() => router.push("/admin/tournaments"), 1000);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

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
        {/* ── 1. Informasi Dasar ─────────────────────────────────────────── */}
        <SectionCard
          icon={<Trophy className="w-4 h-4" />}
          title="Informasi Dasar"
          subtitle="Nama dan jenis turnamen"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nama */}
            <div className="md:col-span-2">
              <Label htmlFor="name">
                Nama Turnamen <span className="text-red-500">*</span>
              </Label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Open Tournament PB Prabu 2025"
                required
                className={`${FIELD_CLASS} ${errors.name ? "border-red-400 focus:border-red-500 focus:ring-red-500/25" : ""}`}
              />
              {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Tipe Turnamen */}
            <div>
              <Label htmlFor="points_id">Tipe Turnamen</Label>
              <select
                id="points_id"
                value={form.points_id}
                onChange={(e) => setField("points_id", e.target.value)}
                className={FIELD_CLASS}
              >
                <option value="">-- Pilih tipe --</option>
                {tournamentTypes.map((tt) => (
                  <option key={tt.id} value={tt.id}>
                    {tt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setField("status", e.target.value as TournamentStatus)}
                className={FIELD_CLASS}
              >
                {(Object.keys(STATUS_CONFIG) as TournamentStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Deskripsi */}
            <div className="md:col-span-2">
              <Label htmlFor="description">Deskripsi</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Deskripsi singkat tentang turnamen ini..."
                rows={3}
                className={`${FIELD_CLASS} resize-none`}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── 1b. Format Pertandingan ─────────────────────────────────── */}
        <SectionCard
          icon={<Swords className="w-4 h-4" />}
          title="Format Pertandingan"
          subtitle="Jenis dan kategori gender pertandingan"
          iconBg="bg-violet-50 dark:bg-violet-500/10"
          iconColor="text-violet-600 dark:text-violet-400"
        >
          <div className="space-y-5">
            {/* Format: Tunggal / Ganda */}
            <div>
              <Label>Format Pertandingan <span className="text-red-500">*</span></Label>
              <div className="flex gap-3 mt-2">
                {([
                  { value: 'ganda', label: 'Ganda', desc: 'Spin wheel untuk bentuk pasangan', icon: '👥' },
                  { value: 'tunggal', label: 'Tunggal', desc: 'Jadwal langsung dari peserta', icon: '🏃' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setField('match_format', opt.value);
                      // Jika ganti ke tunggal dan gender sedang campuran, reset ke putra
                      if (opt.value === 'tunggal' && form.gender_category === 'campuran') {
                        setField('gender_category', 'putra');
                      }
                    }}
                    className={`flex-1 flex flex-col items-center gap-1.5 px-4 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.match_format === opt.value
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="font-semibold">{opt.label}</span>
                    <span className="text-xs text-center opacity-70">{opt.desc}</span>
                  </button>
                ))}
              </div>
              {form.match_format === 'tunggal' && (
                <div className="mt-3 flex items-start gap-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>Format <strong>Tunggal</strong>: Spin Wheel tidak diperlukan. Jadwal Round Robin akan dibuat otomatis langsung dari daftar peserta yang terdaftar.</span>
                </div>
              )}
            </div>

            {/* Gender: Putra / Putri / Campuran */}
            <div>
              <Label>Kategori Gender <span className="text-red-500">*</span></Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-2">
                {form.match_format === 'tunggal'
                  ? 'Tunggal tidak memiliki kategori campuran'
                  : 'Ganda campuran = pasangan beda gender'}
              </p>
              <div className="flex gap-3 mt-2">
                {([
                  { value: 'putra', label: 'Putra', desc: 'Hanya laki-laki', color: 'blue' },
                  { value: 'putri', label: 'Putri', desc: 'Hanya perempuan', color: 'pink' },
                  // Campuran hanya untuk ganda
                  ...(form.match_format === 'ganda'
                    ? [{ value: 'campuran' as const, label: 'Campuran', desc: 'Semua gender', color: 'violet' }]
                    : []),
                ] as const).map(opt => {
                  const active = form.gender_category === opt.value;
                  const cls = active
                    ? opt.color === 'blue'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300'
                      : opt.color === 'pink'
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-300'
                      : 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 hover:border-gray-300';
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setField('gender_category', opt.value)}
                      className={`flex-1 flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all ${cls}`}
                    >
                      <span className="font-semibold">{opt.label}</span>
                      <span className="text-xs opacity-70">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
              {form.gender_category !== 'campuran' && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Hanya peserta {form.gender_category === 'putra' ? 'laki-laki' : 'perempuan'} yang dapat mendaftar turnamen ini.
                </p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── 2. Lokasi & Tanggal ────────────────────────────────────────── */}
        <SectionCard
          icon={<CalendarDays className="w-4 h-4" />}
          title="Lokasi & Jadwal"
          subtitle="Tempat dan rentang waktu penyelenggaraan"
          iconBg="bg-sky-50 dark:bg-sky-500/10"
          iconColor="text-sky-600 dark:text-sky-400"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Lokasi */}
            <div className="md:col-span-2">
              <Label htmlFor="location">Koordinat Peta (Google Maps)</Label>
              <input
                id="location"
                type="text"
                value={form.location}
                onChange={(e) => setField("location", e.target.value)}
                placeholder="Contoh: -6.8977617, 107.5842884"
                className={FIELD_CLASS}
              />
              <p className="mt-1.5 text-[10px] text-gray-500 dark:text-gray-400">
                Cara mendapat koordinat: Buka Google Maps, cari lokasi, klik kanan pada titik peta, lalu klik angka koordinat paling atas untuk meng-copy. Paste ke kolom di atas.
              </p>
            </div>

            {/* Tanggal Mulai */}
            <div>
              <Label htmlFor="start_date">
                Tanggal Mulai <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                id="start_date"
                value={form.start_date}
                onChange={(date) => setField("start_date", date)}
                placeholder="Pilih tanggal mulai"
              />
              {errors.start_date && (
                <p className="mt-1.5 text-xs text-red-500">{errors.start_date}</p>
              )}
            </div>

            {/* Deadline Pendaftaran */}
            <div>
              <Label htmlFor="registration_deadline">Deadline Pendaftaran</Label>
              <DatePicker
                id="registration_deadline"
                value={form.registration_deadline}
                onChange={(date) => setField("registration_deadline", date)}
                placeholder="Pilih deadline"
              />
              {errors.registration_deadline && (
                <p className="mt-1.5 text-xs text-red-500">{errors.registration_deadline}</p>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ── 3. Peserta & Biaya ─────────────────────────────────────────── */}
        <SectionCard
          icon={<Users className="w-4 h-4" />}
          title="Peserta & Biaya"
          subtitle="Kapasitas peserta dan informasi keuangan"
          iconBg="bg-amber-50 dark:bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Max Peserta */}
            <div>
              <Label htmlFor="max_participants">Maks. Peserta</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="max_participants"
                  type="number"
                  min={1}
                  value={form.max_participants}
                  onChange={(e) => setField("max_participants", e.target.value)}
                  placeholder="Tidak terbatas"
                  className={`${FIELD_CLASS} pl-9`}
                />
              </div>
            </div>

            {/* Entry Fee */}
            <div>
              <Label htmlFor="entry_fee">Biaya Pendaftaran (Rp)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="entry_fee"
                  type="number"
                  min={0}
                  value={form.entry_fee}
                  onChange={(e) => setField("entry_fee", e.target.value)}
                  placeholder=""
                  className={`${FIELD_CLASS} pl-9`}
                />
              </div>
            </div>

            {/* Prize Pool */}
            <div>
              <Label htmlFor="prize_pool">Total Hadiah (Rp)</Label>
              <div className="relative">
                <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="prize_pool"
                  type="number"
                  min={0}
                  value={form.prize_pool}
                  onChange={(e) => setField("prize_pool", e.target.value)}
                  placeholder=""
                  className={`${FIELD_CLASS} pl-9`}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* ── 4. Peraturan ──────────────────────────────────────────────── */}
        <SectionCard
          icon={<FileText className="w-4 h-4" />}
          title="Peraturan"
          subtitle="Aturan dan ketentuan turnamen (opsional)"
          iconBg="bg-green-50 dark:bg-green-500/10"
          iconColor="text-green-600 dark:text-green-400"
        >
          <textarea
            id="rules"
            value={form.rules}
            onChange={(e) => setField("rules", e.target.value)}
            placeholder="Tuliskan peraturan turnamen di sini..."
            rows={5}
            className={`${FIELD_CLASS} resize-y`}
          />
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
            id="btn-submit-tournament"
            disabled={saving}
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
