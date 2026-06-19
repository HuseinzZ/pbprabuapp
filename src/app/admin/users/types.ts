// ─── Tipe Dasar ───────────────────────────────────────────────────────────────
export type Level = "pratama" | "utama";
export type Role = "admin" | "user";

// ─── Tipe User (berdasarkan tabel profile) ─────────────────────────
// Tabel profile kini berdiri sendiri dan menyimpan seluruh data user
export interface User {
  id: string;            // profile.id (PK)
  user_id: string | null; // FK ke auth.users.id
  fullname: string;
  username: string | null;
  avatar_url: string | null;
  birth_date: string | null;
  gender: "male" | "female" | null;
  address: string | null;
  height: number | null;
  hand_dominance: string | null;
  level: Level | null;
  ranking_points: number;
  ranking_position: number | null;
  is_active: boolean;
  joined_at: string | null;
  role: Role;            // Sekarang role ada di profile
  created_at: string | null; // Sekarang created_at merujuk pada profile
  
  // Data email diambil secara terpisah dari auth atau diisi null
  email: string | null;
}

// ─── Tipe untuk filter level ──────────────────────────────────────────────────
export type FilterLevel = "all" | "pratama" | "utama";

export const LEVEL_LABELS: Record<FilterLevel, string> = {
  all: "Semua",
  pratama: "Pratama",
  utama: "Utama",
};

export const LEVEL_COLORS: Record<Level, { bg: string; text: string; dot: string }> = {
  pratama: {
    bg: "bg-sky-100 dark:bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  utama: {
    bg: "bg-amber-100 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
};

export interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  type: 'create' | 'update' | 'delete' | 'status_toggle' | 'info';
}
