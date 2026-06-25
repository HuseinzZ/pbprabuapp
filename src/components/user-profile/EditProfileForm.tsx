"use client";
// Form component for editing user profile
import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import InputField from "@/components/form/input/InputField";
import DatePicker from "@/components/form/DatePicker";
import { Loader2, Camera, CheckCircle2, AlertCircle, UserCheck, ArrowLeft, Save, User as UserIcon, Mail, Activity, Shield } from "lucide-react";
import Link from "next/link";
import Loader from "@/components/shared/Loader";
import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import { deleteStorageFile } from "@/lib/utils/storage";

interface Profile {
  id: string;
  fullname: string;
  email: string | null;
  address: string | null;
  gender: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  username: string | null;
  height: number | null;
  hand_dominance: string | null;
  is_active: boolean;
  user_id: string;
}

type NotifType = "success" | "error" | null;
interface Notif { type: NotifType; message: string; }

export default function EditProfileForm({ userId, returnUrl }: { userId: string; returnUrl?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notif, setNotif] = useState<Notif | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateField(name: string, value: any) {
    let error = "";
    switch (name) {
      case "fullname":
        if (!value) error = "Nama lengkap wajib diisi";
        else if (value.length < 3) error = "Nama minimal 3 karakter";
        break;
      case "username":
        if (value && !/^[a-zA-Z0-9._]+$/.test(value)) error = "Hanya huruf, angka, titik, atau underscore";
        else if (value && value.length < 3) error = "Username minimal 3 karakter";
        break;
      case "height":
        const h = parseInt(value);
        if (value && (isNaN(h) || h < 50 || h > 250)) error = "Tinggi harus antara 50-250 cm";
        break;
      case "address":
        if (value && value.length > 200) error = "Alamat maksimal 200 karakter";
        break;
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  }

  const handleChange = (name: string, value: any) => {
    setForm(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  function showNotif(type: NotifType, message: string) {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 4000);
  }

  useEffect(() => {
    async function fetchProfile() {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const { data, error } = await supabase
        .from("profile")
        .select("*")
        .eq("user_id", userId)
        .single();

      // Ambil email dari auth session
      const { data: { session } } = await supabase.auth.getSession();
      const userEmail = session?.user?.email || null;

      if (!error && data) {
        const mappedProfile: Profile = {
          id: data.id,
          user_id: data.user_id,
          fullname: data.fullname || "",
          address: data.address,
          gender: data.gender,
          birth_date: data.birth_date,
          avatar_url: data.avatar_url,
          username: data.username,
          height: data.height,
          hand_dominance: data.hand_dominance,
          is_active: data.is_active ?? true,
          email: userEmail,
        };
        setProfile(mappedProfile);
        setForm(mappedProfile);
      } else if (error) {
        console.error("Error fetching profile:", error);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [supabase, userId]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const filePath = `${profile.id}/avatar_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      showNotif("error", "Gagal upload foto: " + uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profile")
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq("id", profile.id);

    if (updateError) {
      showNotif("error", "Gagal menyimpan URL foto.");
    } else {
      if (profile.avatar_url && profile.avatar_url !== avatarUrl) {
        await deleteStorageFile(profile.avatar_url, "avatars");
      }
      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : prev);
      setForm(prev => ({ ...prev, avatar_url: avatarUrl }));
      showNotif("success", "Foto profil berhasil diperbarui!");
    }
    setUploadingAvatar(false);
  }

  async function handleSave() {
    if (!profile) return;

    const newErrors: Record<string, string> = {};
    const fieldsToValidate = ["fullname", "username", "height", "address"];
    fieldsToValidate.forEach(field => {
      const err = validateField(field, (form as any)[field]);
      if (err) newErrors[field] = err;
    });

    if (Object.values(newErrors).some(e => e)) {
      showNotif("error", "Mohon perbaiki kesalahan pada formulir");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("profile")
      .update({
        fullname: form.fullname,
        address: form.address || null,
        gender: form.gender || null,
        birth_date: form.birth_date || null,
        username: form.username || null,
        height: form.height ? parseInt(form.height.toString()) : null,
        hand_dominance: form.hand_dominance || null,
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      showNotif("error", "Gagal menyimpan: " + error.message);
      setSaving(false);
    } else {
      showNotif("success", "Profil berhasil disimpan!");
      setTimeout(() => {
        router.push(returnUrl || `/admin/profile/${userId}`);
      }, 1000);
    }
  }

  const avatarSrc = form.avatar_url || profile?.avatar_url || null;
  const isProcessing = loading || saving;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  return (
    <ComponentCard title="Edit Profil Pengguna">
        <div className="flex flex-col gap-10">
          {/* Avatar Section - Centered */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt="Avatar"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                    {form.fullname?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Ganti foto profil"
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
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">
                Format yang didukung: JPG, PNG, atau GIF. Maks ukuran 2MB.
              </p>
            </div>
          </div>

          {notif && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm animate-fade-in ${notif.type === "success" ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300" : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"}`}>
              {notif.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {notif.message}
            </div>
          )}

          {/* Main Form Container */}
          <div className="mx-auto w-full max-w-3xl">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSave(); }}
              className="space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="fullname">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </Label>
                  <InputField
                    id="fullname"
                    type="text"
                    value={form.fullname || ""}
                    onChange={(e) => handleChange("fullname", e.target.value)}
                    placeholder="Nama lengkap Anda"
                    error={!!errors.fullname}
                    hint={errors.fullname}
                    icon={<UserIcon className="w-4 h-4" />}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="username">Username</Label>
                  <InputField
                    id="username"
                    type="text"
                    value={form.username || ""}
                    onChange={(e) => handleChange("username", e.target.value)}
                    placeholder="Masukan username"
                    error={!!errors.username}
                    hint={errors.username}
                    icon={<span className="text-xs font-mono font-bold">@</span>}
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={form.email || ""}
                      disabled
                      className="w-full pl-9 px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed opacity-70"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="gender">Jenis Kelamin</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <select
                      id="gender"
                      value={form.gender || ""}
                      onChange={(e) => handleChange("gender", e.target.value)}
                      className="w-full pl-9 px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-500 transition-shadow"
                    >
                      <option value="">Pilih</option>
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="birth_date">Tanggal Lahir</Label>
                  <DatePicker
                    id="birth_date"
                    value={form.birth_date || ""}
                    onChange={(date) => handleChange("birth_date", date)}
                    placeholder="Pilih tanggal"
                    maxDate="today"
                  />
                </div>

                <div>
                  <Label htmlFor="height">Tinggi Badan (cm)</Label>
                  <InputField
                    id="height"
                    type="number"
                    value={form.height || ""}
                    onChange={(e) => handleChange("height", e.target.value)}
                    placeholder="Masukan tinggi badan"
                    error={!!errors.height}
                    hint={errors.height}
                    icon={<span className="text-xs font-bold">cm</span>}
                  />
                </div>

                <div>
                  <Label htmlFor="hand_dominance">Penggunaan Tangan</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    </div>
                    <select
                      id="hand_dominance"
                      value={form.hand_dominance || ""}
                      onChange={(e) => handleChange("hand_dominance", e.target.value)}
                      className="w-full pl-9 px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-500 transition-shadow"
                    >
                      <option value="">Pilih</option>
                      <option value="right">Kanan</option>
                      <option value="left">Kiri</option>
                      <option value="both">Keduanya</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="is_active">Status Aktif</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <select
                      id="is_active"
                      value={form.is_active ? "true" : "false"}
                      onChange={(e) => handleChange("is_active", e.target.value === "true")}
                      className="w-full pl-9 px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-500 transition-shadow"
                    >
                      <option value="true">Aktif</option>
                      <option value="false">Nonaktif</option>
                    </select>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <Label htmlFor="address">Alamat</Label>
                  <textarea
                    id="address"
                    rows={4}
                    value={form.address || ""}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Masukan alamat lengkap Anda"
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 dark:focus:border-brand-500 resize-none transition-shadow ${errors.address ? "border-red-500" : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"}`}
                  />
                  {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                </div>
              </div>

              <div className="flex justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Link
                  href={returnUrl || `/admin/profile/${userId}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </ComponentCard>
  );
}
