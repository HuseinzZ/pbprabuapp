export type TournamentStatus =
  | "upcoming"
  | "registration"
  | "ongoing"
  | "completed"
  | "cancelled";

export interface Tournament {
  id: string;
  tournament_type_id: string | null;
  name: string;
  description: string | null;
  location: string | null;
  start_date: string;
  end_date: string;
  registration_deadline: string | null;
  max_participants: number | null;
  entry_fee: number;
  prize_pool: number;
  status: TournamentStatus;
  poster_url: string | null;
  rules: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // joined from tournament_types
  tournament_types?: { name: string } | null;
}

export interface TournamentFormData {
  tournament_type_id: string;
  name: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  max_participants: string;
  entry_fee: string;
  prize_pool: string;
  status: TournamentStatus;
  rules: string;
}

export const INITIAL_FORM: TournamentFormData = {
  tournament_type_id: "",
  name: "",
  description: "",
  location: "",
  start_date: "",
  end_date: "",
  registration_deadline: "",
  max_participants: "",
  entry_fee: "",
  prize_pool: "",
  status: "upcoming",
  rules: "",
};

export const STATUS_CONFIG: Record<
  TournamentStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  upcoming: {
    label: "Akan Datang",
    bg: "bg-sky-100 dark:bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  registration: {
    label: "Pendaftaran",
    bg: "bg-brand-100 dark:bg-brand-500/10",
    text: "text-brand-700 dark:text-brand-400",
    dot: "bg-brand-500",
  },
  ongoing: {
    label: "Berlangsung",
    bg: "bg-amber-100 dark:bg-amber-500/10",
    text: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Selesai",
    bg: "bg-green-100 dark:bg-green-500/10",
    text: "text-green-700 dark:text-green-400",
    dot: "bg-green-500",
  },
  cancelled: {
    label: "Dibatalkan",
    bg: "bg-red-100 dark:bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
  },
};

export type FilterStatus = "all" | TournamentStatus;
