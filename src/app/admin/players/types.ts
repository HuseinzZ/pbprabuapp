export type Level = "pratama" | "utama";

export interface Player {
  id: string;
  profile_id: string | null;
  full_name: string;
  nickname: string | null;
  email: string | null;
  phone: string | null;
  gender: "male" | "female" | null;
  level: Level | null;
  ranking_points: number;
  ranking_position: number | null;
  is_active: boolean;
  joined_at: string | null;
  height: number | null;
  hand_dominance: string | null;
  avatar_url: string | null;
  address: string | null;
}

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
