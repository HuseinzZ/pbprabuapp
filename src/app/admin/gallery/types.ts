// Tipe data untuk tabel public.gallery di Supabase

export type GalleryCategory = "tournament" | "training" | "event" | "general";

export interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: GalleryCategory | null;
  taken_at: string | null;
  is_published: boolean;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_LABELS: Record<GalleryCategory | "all", string> = {
  all: "Semua",
  tournament: "Turnamen",
  training: "Latihan",
  event: "Event",
  general: "Umum",
};

export const CATEGORY_COLORS: Record<GalleryCategory, { bg: string; text: string }> = {
  tournament: { bg: "bg-amber-100 dark:bg-amber-500/10", text: "text-amber-700 dark:text-amber-400" },
  training:   { bg: "bg-sky-100 dark:bg-sky-500/10",    text: "text-sky-700 dark:text-sky-400"    },
  event:      { bg: "bg-violet-100 dark:bg-violet-500/10", text: "text-violet-700 dark:text-violet-400" },
  general:    { bg: "bg-gray-100 dark:bg-gray-700/40",   text: "text-gray-600 dark:text-gray-400"  },
};
