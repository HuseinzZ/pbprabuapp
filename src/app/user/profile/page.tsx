"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  UserCircle, Mail, Phone, MapPin, Calendar, Edit3, LogOut,
  Trophy, Star, ShieldCheck, Loader2
} from "lucide-react";

interface ProfileData {
  id: string;
  fullname: string | null;
  username: string | null;
  avatar_url: string | null;
  gender: string | null;
  level: string | null;
  ranking_points: number;
  ranking_position: number | null;
  is_active: boolean;
  joined_at: string | null;
  address: string | null;
  height: number | null;
  hand_dominance: string | null;
  birth_date: string | null;
  user_id: string | null;
}

interface UserData {
  email: string | null;
  role: string;
}

export default function UserProfilePage() {
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      // Cek sesi auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login");
        return;
      }

      // Ambil data profile via user_id
      const { data: profileData } = await supabase
        .from("profile")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Ambil data users (email, role)
      const { data: usersData } = await supabase
        .from("users")
        .select("email, role")
        .eq("id", user.id)
        .single();

      setProfile(profileData as ProfileData);
      setUserData(usersData as UserData ?? { email: user.email ?? null, role: "user" });
      setLoading(false);
    }
    fetchProfile();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const displayName = profile?.fullname || userData?.email?.split("@")[0] || "Pengguna";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profil Saya</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Informasi dan statistik akun Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Kartu Profil */}
        <div className="lg:col-span-1 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="h-24 w-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                initials
              )}
            </div>
          </div>

          {/* Nama & Email */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
          {profile?.username && (
            <p className="text-sm text-indigo-500 font-medium">@{profile.username}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{userData?.email ?? "—"}</p>

          {/* Role & Level Badge */}
          <div className="flex gap-2 flex-wrap justify-center mt-3">
            {userData?.role === "admin" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-400">
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
            )}
            {profile?.level && (
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                profile.level === "utama"
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                  : "bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400"
              }`}>
                <Star className="w-3 h-3" />
                {profile.level === "utama" ? "Utama" : "Pratama"}
              </span>
            )}
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
              profile?.is_active
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}>
              {profile?.is_active ? "Aktif" : "Nonaktif"}
            </span>
          </div>

          {/* Info Detail */}
          <div className="mt-5 w-full pt-5 border-t border-gray-100 dark:border-gray-800 space-y-3 text-sm text-left">
            {profile?.gender && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <UserCircle className="w-3.5 h-3.5" /> Jenis Kelamin
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {profile.gender === "male" ? "Laki-laki" : "Perempuan"}
                </span>
              </div>
            )}
            {profile?.height && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Tinggi Badan</span>
                <span className="font-medium text-gray-900 dark:text-white">{profile.height} cm</span>
              </div>
            )}
            {profile?.hand_dominance && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Tangan Dominan</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {profile.hand_dominance === "right" ? "Kanan" : profile.hand_dominance === "left" ? "Kidal" : "Keduanya"}
                </span>
              </div>
            )}
            {profile?.joined_at && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Bergabung
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(profile.joined_at).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
                </span>
              </div>
            )}
            {profile?.address && (
              <div className="flex justify-between gap-2">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 shrink-0">
                  <MapPin className="w-3.5 h-3.5" /> Alamat
                </span>
                <span className="font-medium text-gray-900 dark:text-white text-right text-xs">
                  {profile.address}
                </span>
              </div>
            )}
          </div>

          {/* Tombol Edit Profil */}
          <Link
            href="/user/profile/edit"
            className="mt-5 w-full h-10 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition flex items-center justify-center gap-2"
          >
            <Edit3 className="w-4 h-4" /> Edit Profil
          </Link>
        </div>

        {/* Kolom Kanan */}
        <div className="lg:col-span-2 space-y-5">
          {/* Statistik Poin */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {(profile?.ranking_points ?? 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Poin</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
                <Trophy className="w-5 h-5" />
                {profile?.ranking_position ? `#${profile.ranking_position}` : "—"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Peringkat</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-center col-span-2 sm:col-span-1">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {profile?.level ? (profile.level === "utama" ? "Utama" : "Pratama") : "—"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Level</p>
            </div>
          </div>

          {/* Info Akun */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-500" /> Informasi Akun
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Email</span>
                <span className="font-medium text-gray-900 dark:text-white">{userData?.email ?? "—"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Role</span>
                <span className={`font-medium ${userData?.role === "admin" ? "text-purple-600 dark:text-purple-400" : "text-gray-900 dark:text-white"}`}>
                  {userData?.role === "admin" ? "Administrator" : "User"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-500">Status Akun</span>
                <span className={`font-medium ${profile?.is_active ? "text-green-600 dark:text-green-400" : "text-gray-500"}`}>
                  {profile?.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </div>
            </div>
          </div>

          {/* Logout */}
          <div className="flex justify-end">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-5 py-2.5 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/10 transition"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
