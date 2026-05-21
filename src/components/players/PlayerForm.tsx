"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Camera, CheckCircle2, AlertCircle, UserCheck } from "lucide-react";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import InputField from "@/components/form/input/InputField";
import Loader from "@/components/shared/Loader";
import { Player, Level } from "@/app/admin/players/types";
import { deleteStorageFile } from "@/lib/utils/storage";

interface PlayerFormProps {
  playerId?: string; // jika ada = mode edit
}

type NotifType = "success" | "error" | null;
interface Notif { type: NotifType; message: string; }

const FIELD_CLASS = "w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-shadow";

export default function PlayerForm({ playerId }: PlayerFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = !!playerId;

  const [form, setForm] = useState({
    full_name: "",
    nickname: "",
    email: "",
    phone: "",
    gender: "",
    level: "",
    is_active: true,
    height: "",
    hand_dominance: "",
    avatar_url: "",
    address: "",
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [initialAvatarUrl, setInitialAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notif, setNotif] = useState<Notif | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function showNotif(type: NotifType, message: string) {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 4000);
  }

  function validateField(name: string, value: any) {
    let error = "";
    switch (name) {
      case "full_name":
        if (!value) error = "Nama lengkap wajib diisi";
        else if (value.length < 3) error = "Nama minimal 3 karakter";
        break;
      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          error = "Format email tidak valid";
        break;
      case "phone":
        if (value && !/^\+?[0-9\-\s]{9,20}$/.test(value))
          error = "Nomor telepon tidak valid";
        break;
      case "height":
        if (value) {
          const h = parseInt(value);
          if (isNaN(h) || h < 50 || h > 300) error = "Tinggi harus antara 50-300 cm";
        }
        break;
      case "address":
        if (value && value.length > 200) error = "Alamat maksimal 200 karakter";
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error;
  }

  const handleChange = (name: string, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  useEffect(() => {
    if (!playerId) return;
    async function fetchPlayer() {
      setLoading(true);
      const { data } = await supabase
        .from("players")
        .select("*")
        .eq("id", playerId)
        .single();
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          nickname: data.nickname ?? "",
          email: data.email ?? "",
          phone: data.phone ?? "",
          gender: data.gender ?? "",
          level: data.level ?? "",
          is_active: data.is_active ?? true,
          height: data.height?.toString() ?? "",
          hand_dominance: data.hand_dominance ?? "",
          avatar_url: data.avatar_url ?? "",
          address: data.address ?? "",
        });
        setInitialAvatarUrl(data.avatar_url ?? null);
      }
      setLoading(false);
    }
    fetchPlayer();
  }, [playerId]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const filePath = `player-avatars/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      showNotif("error", "Gagal upload foto: " + uploadError.message);
      setUploadingAvatar(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
    setForm((prev) => ({ ...prev, avatar_url: `${publicUrl}?t=${Date.now()}` }));
    showNotif("success", "Foto berhasil diperbarui!");
    setUploadingAvatar(false);
  }

  async function handleSave() {
    const newErrors: Record<string, string> = {};
    ["full_name", "email", "phone", "height", "address"].forEach((field) => {
      const err = validateField(field, (form as any)[field]);
      if (err) newErrors[field] = err;
    });
    if (Object.values(newErrors).some((e) => e)) {
      showNotif("error", "Mohon perbaiki kesalahan pada formulir");
      return;
    }

    setSaving(true);
    const payload = {
      full_name: form.full_name,
      nickname: form.nickname || null,
      email: form.email || null,
      phone: form.phone || null,
      gender: form.gender || null,
      level: (form.level as Level) || null,
      is_active: form.is_active,
      height: form.height ? parseInt(form.height) : null,
      hand_dominance: form.hand_dominance || null,
      avatar_url: form.avatar_url || null,
      address: form.address || null,
    };

    let error = null;
    if (isEdit && playerId) {
      const res = await supabase.from("players").update(payload).eq("id", playerId);
      error = res.error;
      if (!error && initialAvatarUrl && initialAvatarUrl !== form.avatar_url) {
        await deleteStorageFile(initialAvatarUrl, "avatars");
      }
    } else {
      const res = await supabase.from("players").insert(payload);
      error = res.error;
    }

    if (error) {
      showNotif("error", "Gagal menyimpan: " + error.message);
      setSaving(false);
      return;
    }

    showNotif("success", isEdit ? "Data pemain berhasil disimpan!" : "Pemain baru berhasil ditambahkan!");
    setTimeout(() => router.push("/admin/players"), 1000);
  }

  const isProcessing = loading || saving;

  return (
    <>
      {/* {isProcessing && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
          <Loader />
        </div>
      )} */}

      <ComponentCard title={isEdit ? "Edit Data Pemain" : "Tambah Pemain Baru"}>
        <div className="flex flex-col gap-10">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                {form.avatar_url ? (
                  <Image
                    src={form.avatar_url}
                    alt="Avatar"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                    <UserCheck className="w-16 h-16" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Ganti foto"
              >
                {uploadingAvatar ? (
                  <Loader2 size={24} className="text-white animate-spin" />
                ) : (
                  <>
                    <Camera size={24} className="text-white mb-1" />
                    <span className="text-xs text-white font-medium">Ubah Foto</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Format yang didukung: JPG, PNG, atau GIF. Maks 2MB.
            </p>
          </div>

          {/* Notif */}
          {notif && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${notif.type === "success" ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300" : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"}`}>
              {notif.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {notif.message}
            </div>
          )}

          {/* Form */}
          <div className="max-w-3xl mx-auto w-full">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSave(); }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Nama Lengkap */}
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="full_name">Nama Lengkap <span className="text-red-500">*</span></Label>
                  <InputField
                    id="full_name"
                    type="text"
                    value={form.full_name}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                    placeholder="Nama lengkap pemain"
                    error={!!errors.full_name}
                    hint={errors.full_name}
                    required
                  />
                </div>

                {/* Nickname */}
                <div>
                  <Label htmlFor="nickname">Nama Panggilan</Label>
                  <InputField
                    id="nickname"
                    type="text"
                    value={form.nickname}
                    onChange={(e) => handleChange("nickname", e.target.value)}
                    placeholder="Nickname"
                  />
                </div>

                {/* Level */}
                <div>
                  <Label htmlFor="level">Level</Label>
                  <select
                    id="level"
                    value={form.level}
                    onChange={(e) => handleChange("level", e.target.value)}
                    className={FIELD_CLASS}
                  >
                    <option value="">Pilih level</option>
                    <option value="pratama">Pratama</option>
                    <option value="utama">Utama</option>
                  </select>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email">Email</Label>
                  <InputField
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="email@example.com"
                    error={!!errors.email}
                    hint={errors.email}
                  />
                </div>

                {/* Telepon */}
                <div>
                  <Label htmlFor="phone">No. Telepon</Label>
                  <InputField
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="Masukan nomor telepon"
                    error={!!errors.phone}
                    hint={errors.phone}
                  />
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <Label htmlFor="gender">Jenis Kelamin</Label>
                  <select
                    id="gender"
                    value={form.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className={FIELD_CLASS}
                  >
                    <option value="">Pilih</option>
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>

                {/* Tinggi Badan */}
                <div>
                  <Label htmlFor="height">Tinggi Badan (cm)</Label>
                  <InputField
                    id="height"
                    type="number"
                    value={form.height}
                    onChange={(e) => handleChange("height", e.target.value)}
                    placeholder="Masukan tinggi badan"
                    error={!!errors.height}
                    hint={errors.height}
                  />
                </div>

                {/* Penggunaan Tangan */}
                <div>
                  <Label htmlFor="hand_dominance">Penggunaan Tangan</Label>
                  <select
                    id="hand_dominance"
                    value={form.hand_dominance}
                    onChange={(e) => handleChange("hand_dominance", e.target.value)}
                    className={FIELD_CLASS}
                  >
                    <option value="">Pilih</option>
                    <option value="right">Kanan</option>
                    <option value="left">Kidal</option>
                    <option value="both">Keduanya</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <Label htmlFor="is_active">Status Pemain</Label>
                  <select
                    id="is_active"
                    value={form.is_active ? "true" : "false"}
                    onChange={(e) => handleChange("is_active", e.target.value === "true")}
                    className={FIELD_CLASS}
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>

                {/* Alamat */}
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="address">Alamat</Label>
                  <textarea
                    id="address"
                    rows={4}
                    value={form.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Alamat lengkap pemain"
                    className={`${FIELD_CLASS} resize-none ${errors.address ? "border-red-500" : ""}`}
                  />
                  {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Link
                  href="/admin/players"
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Batal
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-sm"
                >
                  {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Pemain"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ComponentCard>
    </>
  );
}
