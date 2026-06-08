// ─── Types ────────────────────────────────────────────────────────────────────

export type ParticipantStatus = "pending" | "confirmed" | "withdrawn" | "disqualified";
export type PaymentStatus = "unpaid" | "paid" | "refunded";

export interface Participant {
  id: string;
  tournament_id: string | null;
  player_id: string | null;
  status: ParticipantStatus | null;
  registered_at: string | null;
  payment_status: PaymentStatus | string | null;
  notes: string | null;
  // joined
  players?: {
    full_name: string;
    nickname: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
    level: string | null;
    ranking_points: number;
  } | null;
  tournaments?: {
    name: string;
    status: string;
    start_date: string;
  } | null;
}

export type FilterParticipantStatus = "all" | ParticipantStatus;

export const STATUS_CONFIG: Record<
  ParticipantStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  pending: {
    label: "Menunggu",
    bg: "bg-yellow-100 dark:bg-yellow-500/10",
    text: "text-yellow-700 dark:text-yellow-400",
    dot: "bg-yellow-500",
  },
  confirmed: {
    label: "Terkonfirmasi",
    bg: "bg-green-100 dark:bg-green-500/10",
    text: "text-green-700 dark:text-green-400",
    dot: "bg-green-500",
  },
  withdrawn: {
    label: "Mundur",
    bg: "bg-red-100 dark:bg-red-500/10",
    text: "text-red-700 dark:text-red-400",
    dot: "bg-red-500",
  },
  disqualified: {
    label: "Didiskualifikasi",
    bg: "bg-orange-100 dark:bg-orange-500/10",
    text: "text-orange-700 dark:text-orange-400",
    dot: "bg-orange-500",
  },
};

export const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  unpaid: { label: "Belum Bayar", color: "text-red-600 dark:text-red-400" },
  paid: { label: "Lunas", color: "text-green-600 dark:text-green-400" },
  refunded: { label: "Dikembalikan", color: "text-orange-600 dark:text-orange-400" },
};

export const STATUS_FILTER_OPTIONS: { value: FilterParticipantStatus; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Menunggu" },
  { value: "confirmed", label: "Terkonfirmasi" },
  { value: "withdrawn", label: "Mundur" },
  { value: "disqualified", label: "Didiskualifikasi" },
];

export interface ParticipantFormData {
  tournament_id: string;
  player_id: string;
  player_ids: string[];
  status: ParticipantStatus;
  payment_status: string;
  notes: string;
}

export const INITIAL_FORM: ParticipantFormData = {
  tournament_id: "",
  player_id: "",
  player_ids: [],
  status: "pending",
  payment_status: "unpaid",
  notes: "",
};
