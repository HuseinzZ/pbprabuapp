"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Loader2, Camera, CheckCircle2, AlertCircle, ArrowLeft, Save,
  User as UserIcon, Mail, Shield, Lock, Eye, EyeOff, Check, Activity,
} from "lucide-react";
import Link from "next/link";
import { Level, Role } from "@/app/admin/users/types";
import { deleteStorageFile } from "@/lib/utils/storage";
import DatePicker from "@/components/form/DatePicker";

interface UserFormProps {
  playerId?: string;
}

type NotifType = "success" | "error" | null;
interface Notif { type: NotifType; message: string; }

interface PasswordStrength {
  score: number;
  label: string;
}

function calcPasswordStrength(pwd: string): PasswordStrength {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ["Sangat Lemah", "Lemah", "Sedang", "Kuat", "Sangat Kuat"];
  return { score, label: labels[score] };
}

const FC = "w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 border rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500 outline-none transition-all border-gray-200 dark:border-gray-700";
const FC_ERR = "w-full pl-9 pr-4 py-2.5 bg-red-50/30 dark:bg-red-900/10 hover:bg-white dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 border border-red-400 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-red-300/40 outline-none transition-all";
const SEL = "w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500 outline-none transition-all";

export default function UserForm({ playerId }: UserFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!playerId;

  const [form, setForm] = useState({
    fullname: "", username: "", email: "", password: "", confirmPassword: "",
    gender: "", role: "user" as Role, level: "", is_active: true,
    avatar_url: "", address: "", height: "", hand_dominance: "", birth_date: "",
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [initialAvatarUrl, setInitialAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notif, setNotif] = useState<Notif | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdStrength, setPwdStrength] = useState<PasswordStrength>({ score: 0, label: "Sangat Lemah" });

  function showNotif(type: NotifType, message: string) {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 5000);
  }

  useEffect(() => {
    if (form.password) setPwdStrength(calcPasswordStrength(form.password));
    else setPwdStrength({ score: 0, label: "Sangat Lemah" });
  }, [form.password]);

  useEffect(() => {
    if (!playerId) return;
    async function fetchUser() {
      setLoading(true);
      const { data } = await supabase
        .from("profile")
        .select(`id, fullname, username, avatar_url, gender, level, is_active, address, height, hand_dominance, birth_date, user_id, role`)
        .eq("id", playerId)
        .single();

      if (data) {
        let userEmail = "";
        try {
          const res = await fetch("/api/admin/users");
          if (res.ok) {
            const result = await res.json();
            if ((data as any).user_id && result.emailMap?.[( data as any).user_id]) {
              userEmail = result.emailMap[(data as any).user_id];
            }
          }
        } catch (e) { console.error("Gagal fetch email", e); }

        setForm({
          fullname: (data as any).fullname ?? "",
          username: (data as any).username ?? "",
          email: userEmail,
          password: "", confirmPassword: "",
          gender: (data as any).gender ?? "",
          role: (data as any).role ?? "user",
          level: (data as any).level ?? "",
          is_active: (data as any).is_active ?? true,
          avatar_url: (data as any).avatar_url ?? "",
          address: (data as any).address ?? "",
          height: (data as any).height?.toString() ?? "",
          hand_dominance: (data as any).hand_dominance ?? "",
          birth_date: (data as any).birth_date ?? "",
        });
        setInitialAvatarUrl((data as any).avatar_url ?? null);
      }
      setLoading(false);
    }
    fetchUser();
  }, [playerId]);

  function setField(name: string, value: any) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const filePath = `avatars/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) { showNotif("error", "Gagal upload foto: " + uploadError.message); setUploadingAvatar(false); return; }
    
    // Hapus avatar yang baru saja diupload jika user mengupload lagi (sebelum save)
    const oldAvatarUrl = form.avatar_url;
    if (oldAvatarUrl && oldAvatarUrl !== initialAvatarUrl) {
      await deleteStorageFile(oldAvatarUrl, "avatars");
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setField("avatar_url", `${publicUrl}?t=${Date.now()}`);
    showNotif("success", "Foto berhasil diperbarui!");
    setUploadingAvatar(false);
  }

  function validate() {
    const newErrors: Record<string, string> = {};
    if (!form.fullname.trim()) newErrors.fullname = "Nama lengkap wajib diisi.";
    else if (form.fullname.trim().length < 3) newErrors.fullname = "Nama minimal 3 karakter.";

    if (!isEdit && !form.email.trim()) newErrors.email = "Email wajib diisi.";
    else if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Format email tidak valid.";

    if (form.password) {
      if (pwdStrength.score < 2) newErrors.password = "Password terlalu lemah. Minimal tingkat \"Sedang\".";
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Konfirmasi password tidak cocok.";
    } else if (!isEdit) {
      // password opsional saat tambah baru, jadi tidak wajib
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSave() {
    if (!validate()) { showNotif("error", "Mohon perbaiki kesalahan pada formulir."); return; }
    setSaving(true);

    const payload = {
      id: isEdit ? playerId : undefined,
      fullname: form.fullname,
      username: form.username || null,
      email: !isEdit ? (form.email || null) : undefined,
      password: form.password || null,
      gender: form.gender || null,
      role: form.role,
      level: (form.level as Level) || null,
      is_active: form.is_active,
      avatar_url: form.avatar_url || null,
      address: form.address || null,
      height: form.height ? parseInt(form.height) : null,
      hand_dominance: form.hand_dominance || null,
      birth_date: form.birth_date || null,
    };

    try {
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch("/api/admin/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menyimpan data");

      if (isEdit && initialAvatarUrl && initialAvatarUrl !== form.avatar_url) {
        await deleteStorageFile(initialAvatarUrl, "avatars");
      }

      // ── SIMPAN LOG AKTIVITAS ──
      try {
        const storedLogs = localStorage.getItem('manajemen_pengguna_logs');
        let logs = storedLogs ? JSON.parse(storedLogs) : [];
        logs.push({
          id: `log-${Date.now()}`,
          action: isEdit ? `Profil @${form.fullname} diperbarui` : `Pengguna baru @${form.fullname} didaftarkan`,
          timestamp: new Date().toISOString(),
          type: isEdit ? 'update' : 'create'
        });
        localStorage.setItem('manajemen_pengguna_logs', JSON.stringify(logs.slice(-50)));
      } catch (err) { console.error("Gagal menyimpan log", err); }
      // ───────────────────────────

      showNotif("success", isEdit ? "Data user berhasil disimpan!" : "User baru berhasil ditambahkan!");
      setTimeout(() => router.push("/admin/users"), 1200);
    } catch (err: any) {
      showNotif("error", err.message);
      setSaving(false);
    }
  }

  function getAvatarGradient() {
    if (form.role === "admin") return "from-violet-500 to-purple-700";
    return "from-brand-400 to-brand-600";
  }

  function getInitials(name: string) {
    const parts = name.trim().split(/\s+/);
    if (!parts[0]) return "?";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  const strengthColors = ["", "bg-red-500", "bg-amber-500", "bg-emerald-500", "bg-brand-500"];
  const strengthTextColors = ["", "text-red-600", "text-amber-600", "text-emerald-600", "text-brand-600"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">

      {/* ── Header ── */}
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-3">
        <div className="p-2 bg-brand-500 text-white rounded-lg">
          <UserIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {isEdit ? "Edit Data User" : "Tambah User Baru"}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Pastikan data yang dimasukkan sudah benar sebelum disimpan.
          </p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="p-6 space-y-6">

        {/* ── Notifikasi ── */}
        {notif && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
            notif.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
          }`}>
            {notif.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {notif.message}
          </div>
        )}

        {/* ── Preview Badge ── */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center gap-4">
          {/* Avatar dengan upload */}
          <div className="relative group shrink-0">
            <div className={`w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br ${getAvatarGradient()} flex items-center justify-center text-white text-xl font-bold shadow-sm border-2 border-white dark:border-gray-700`}>
              {form.avatar_url ? (
                <Image src={form.avatar_url} alt="Avatar" fill className="object-cover" unoptimized />
              ) : (
                getInitials(form.fullname || "?")
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {uploadingAvatar ? <Loader2 size={16} className="text-white animate-spin" /> : <Camera size={16} className="text-white" />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* Info Preview */}
          <div className="text-center sm:text-left min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white truncate">
              {form.fullname || "Nama Lengkap"}
            </h3>
            <p className="text-xs font-mono text-brand-600 dark:text-brand-400 mt-0.5 truncate">
              @{form.username || "username"}
            </p>
            <p className="text-xs text-gray-400 truncate mt-0.5">
              {form.email || "email@domain.com"}
            </p>
          </div>

          {/* Badges */}
          <div className="shrink-0 flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
              form.is_active
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800"
                : "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-800"
            }`}>
              {form.is_active ? "Aktif" : "Nonaktif"}
            </span>
            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
              form.role === "admin"
                ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-800"
                : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
            }`}>
              {form.role}
            </span>
          </div>
        </div>

        {/* ── Grid Fields ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Nama Lengkap */}
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="fullname" className="block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-1.5">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="fullname" type="text"
                value={form.fullname}
                onChange={(e) => { setField("fullname", e.target.value); if (errors.fullname) setErrors(p => ({ ...p, fullname: "" })); }}
                placeholder="cth: Ridwan Husaeni"
                className={errors.fullname ? FC_ERR : FC}
              />
            </div>
            {errors.fullname && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.fullname}
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs font-mono">@</div>
              <input
                id="username" type="text"
                value={form.username}
                onChange={(e) => setField("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="username_anda"
                className={FC + " font-mono"}
              />
            </div>
            <p className="mt-1 text-[9.5px] text-gray-400 font-mono">Karakter aman: a-z, 0-9, dan _</p>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-1.5">
              Email {isEdit ? <span className="text-gray-400 font-normal lowercase">(tidak dapat diubah)</span> : <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email" type="email"
                value={form.email}
                onChange={(e) => { if (!isEdit) { setField("email", e.target.value); if (errors.email) setErrors(p => ({ ...p, email: "" })); } }}
                placeholder="email@contoh.com"
                disabled={isEdit}
                className={isEdit
                  ? "w-full pl-9 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-70 outline-none"
                  : (errors.email ? FC_ERR : FC)
                }
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.email}
              </p>
            )}
          </div>

          {/* Level */}
          <div>
            <label htmlFor="level" className="block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-1.5">
              Level Pemain
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Activity className="w-4 h-4" />
              </div>
              <select id="level" value={form.level} onChange={(e) => setField("level", e.target.value)} className={SEL}>
                <option value="">Pilih level</option>
                <option value="pratama">Pratama</option>
                <option value="utama">Utama</option>
              </select>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label htmlFor="gender" className="block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-1.5">
              Jenis Kelamin
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <select id="gender" value={form.gender} onChange={(e) => setField("gender", e.target.value)} className={SEL}>
                <option value="">Pilih</option>
                <option value="male">Laki-laki</option>
                <option value="female">Perempuan</option>
              </select>
            </div>
          </div>

          {/* Tanggal Lahir */}
          <div>
            <label htmlFor="birth_date" className="block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-1.5">
              Tanggal Lahir
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Activity className="w-4 h-4" />
              </div>
              <DatePicker
                id="birth_date"
                value={form.birth_date}
                onChange={(date) => setField("birth_date", date)}
                placeholder="Pilih tanggal lahir"
              />
            </div>
          </div>

          {/* Tinggi Badan */}
          <div>
            <label htmlFor="height" className="block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-1.5">
              Tinggi Badan (cm)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs font-bold">cm</div>
              <input id="height" type="number" value={form.height}
                onChange={(e) => setField("height", e.target.value)}
                placeholder="170"
                className={FC} />
            </div>
          </div>

          {/* Penggunaan Tangan */}
          <div>
            <label htmlFor="hand_dominance" className="block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-1.5">
              Penggunaan Tangan
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Activity className="w-4 h-4" />
              </div>
              <select id="hand_dominance" value={form.hand_dominance} onChange={(e) => setField("hand_dominance", e.target.value)} className={SEL}>
                <option value="">Pilih</option>
                <option value="right">Kanan</option>
                <option value="left">Kidal</option>
                <option value="both">Keduanya</option>
              </select>
            </div>
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-1.5">
              Role (Hak Akses)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Shield className="w-4 h-4" />
              </div>
              <select id="role" value={form.role} onChange={(e) => setField("role", e.target.value as Role)} className={SEL}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Status Aktif */}
          <div>
            <span className="block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-1.5">
              Status Akun
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setField("is_active", true)}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                  form.is_active
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20 dark:bg-emerald-500/10 dark:border-emerald-700 dark:text-emerald-300"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                }`}>
                <span className={`w-2 h-2 rounded-full ${form.is_active ? "bg-emerald-500" : "bg-gray-300"}`} />
                Aktif
              </button>
              <button type="button" onClick={() => setField("is_active", false)}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                  !form.is_active
                    ? "bg-red-50 border-red-300 text-red-800 ring-2 ring-red-500/20 dark:bg-red-500/10 dark:border-red-700 dark:text-red-300"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                }`}>
                <span className={`w-2 h-2 rounded-full ${!form.is_active ? "bg-red-500" : "bg-gray-300"}`} />
                Nonaktif
              </button>
            </div>
          </div>

          {/* Alamat */}
          <div className="col-span-1 md:col-span-2">
            <label htmlFor="address" className="block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-1.5">
              Alamat
            </label>
            <textarea id="address" rows={3} value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="Alamat lengkap"
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500 outline-none transition-all resize-none" />
          </div>
        </div>

        {/* ── Bagian Password ── */}
        <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                {isEdit ? "Ganti Password (Opsional)" : "Kata Sandi Aman"}
              </h4>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {isEdit ? "Kosongkan jika tidak ingin mengubah password." : "Biarkan kosong untuk generate otomatis."}
              </p>
            </div>
            <div className="p-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-500">
              <Lock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-1">
                Kata Sandi {!isEdit && <span className="text-gray-400 font-normal lowercase">(opsional)</span>}
              </label>
              <div className="relative">
                <input id="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => { setField("password", e.target.value); if (errors.password) setErrors(p => ({ ...p, password: "" })); }}
                  placeholder={isEdit ? "••••••••" : "Buat password kuat"}
                  className={`w-full px-3 py-2.5 pr-10 bg-white dark:bg-gray-900 border rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 outline-none transition-all ${errors.password ? "border-red-400 focus:ring-red-300/40" : "border-gray-200 dark:border-gray-700 focus:ring-brand-500/25 focus:border-brand-500"}`}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-[10px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 mb-1">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <input id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => { setField("confirmPassword", e.target.value); if (errors.confirmPassword) setErrors(p => ({ ...p, confirmPassword: "" })); }}
                  placeholder="Ulangi password"
                  className={`w-full px-3 py-2.5 pr-10 bg-white dark:bg-gray-900 border rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 outline-none transition-all ${errors.confirmPassword ? "border-red-400 focus:ring-red-300/40" : "border-gray-200 dark:border-gray-700 focus:ring-brand-500/25 focus:border-brand-500"}`}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Error password */}
          {errors.password && (
            <p className="text-xs text-red-600 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.password}
            </p>
          )}
          {errors.confirmPassword && (
            <p className="text-xs text-red-600 flex items-center gap-1.5 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.confirmPassword}
            </p>
          )}

          {/* Password Strength */}
          {form.password && (
            <div className="space-y-2">
              <div className="flex gap-1.5 h-1.5 rounded overflow-hidden">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`flex-1 rounded-sm transition-all duration-200 ${pwdStrength.score >= i ? strengthColors[i] : "bg-gray-200 dark:bg-gray-700"}`} />
                ))}
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-500 font-bold tracking-wider uppercase">Kekuatan:</span>
                <span className={`font-bold uppercase tracking-wide ${strengthTextColors[pwdStrength.score] || "text-gray-400"}`}>
                  {pwdStrength.label} ({pwdStrength.score}/4)
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-2 text-[10px]">
                {[
                  { ok: form.password.length >= 8, label: "Min. 8 Karakter" },
                  { ok: /[a-z]/.test(form.password) && /[A-Z]/.test(form.password), label: "Huruf Besar & Kecil" },
                  { ok: /[0-9]/.test(form.password), label: "Angka (0-9)" },
                  { ok: /[^A-Za-z0-9]/.test(form.password), label: "Karakter Spesial" },
                ].map(({ ok, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    {ok
                      ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      : <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-1 shrink-0" />
                    }
                    <span className={ok ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-gray-400 font-medium"}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Link href="/admin/users"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-sm">
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</>
              : <><Save className="w-4 h-4" />{isEdit ? "Simpan" : "Tambah"}</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}
