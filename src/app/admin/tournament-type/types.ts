export interface TournamentType {
  id: string;
  name: string;
  points_winner: number;
  points_finalist: number;
  points_semifinalist: number;
  points_quarterfinalist: number;
  points_r16: number | null;
  points_r32: number | null;
  points_r64: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TournamentTypeFormData = Omit<TournamentType, "id" | "created_at" | "updated_at">;

export const INITIAL_FORM_DATA: TournamentTypeFormData = {
  name: "",
  points_winner: 0,
  points_finalist: 0,
  points_semifinalist: 0,
  points_quarterfinalist: 0,
  points_r16: 0,
  points_r32: 0,
  points_r64: 0,
  description: null,
  is_active: true,
};

export const POINT_FIELDS: {
  key: keyof TournamentTypeFormData;
  label: string;
  required?: boolean;
}[] = [
  { key: "points_winner", label: "Juara 1 (Winner)", required: true },
  { key: "points_finalist", label: "Juara 2 (Finalist)", required: true },
  { key: "points_semifinalist", label: "Semi Final", required: true },
  { key: "points_quarterfinalist", label: "Quarter Final", required: true },
  { key: "points_r16", label: "Round of 16 (R16)" },
  { key: "points_r32", label: "Round of 32 (R32)" },
  { key: "points_r64", label: "Round of 64 (R64)" },
];
