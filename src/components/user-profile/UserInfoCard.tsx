"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import Loader from "@/components/shared/Loader";

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  gender: string | null;
  birth_date: string | null;
  avatar_url: string | null;
  username: string | null;
  height: number | null;
  hand_dominance: string | null;
  is_active: boolean;
}

export default function UserInfoCard({ userId }: { userId: string }) {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, address, gender, birth_date, avatar_url, username, height, hand_dominance, is_active")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data as Profile);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [supabase, userId]);

  const avatarSrc = profile?.avatar_url || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      {/* Avatar section */}
      <div className="flex flex-col items-center gap-4 mb-6 sm:flex-row sm:items-center">
        <div className="relative group">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt="Avatar"
                width={80}
                height={80}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {profile?.full_name || "—"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {profile?.email || ""}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-800 text-center mb-6 dark:text-white/90 lg:mb-6">
            Informasi Pribadi
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Nama Lengkap</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{profile?.full_name || "—"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Username</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{profile?.username || "—"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{profile?.email || "—"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">No. Telepon</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{profile?.phone || "—"}</p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Jenis Kelamin</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile?.gender === "male" ? "Laki-laki" : profile?.gender === "female" ? "Perempuan" : "—"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Tanggal Lahir</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile?.birth_date ? (() => {
                  const [y, m, d] = profile.birth_date.split("-").map(Number);
                  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
                })() : "—"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Tinggi Badan</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile?.height ? `${profile.height} cm` : "—"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Penggunaan Tangan</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {profile?.hand_dominance === "right" ? "Kanan" : profile?.hand_dominance === "left" ? "Kiri" : profile?.hand_dominance === "both" ? "Keduanya" : "—"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Status</p>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${profile?.is_active
                  ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${profile?.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                {profile?.is_active ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">Alamat</p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">{profile?.address || "—"}</p>
            </div>
          </div>
        </div>

        <Link
          href={`/admin/profile/edit/${userId}`}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto shrink-0 self-start"
        >
          <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z" fill="" />
          </svg>
          Edit
        </Link>
      </div>
    </div>
  );
}
