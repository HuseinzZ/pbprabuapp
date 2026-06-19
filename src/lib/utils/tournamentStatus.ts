import { createClient } from "@/lib/supabase/client";

export async function syncTournamentStatuses() {
  const supabase = createClient();
  
  const { data: tournaments, error } = await supabase
    .from("tournaments")
    .select("id, status, start_date, registration_deadline");

  if (error || !tournaments) return;

  const now = new Date();
  now.setHours(0, 0, 0, 0); // normalize to midnight for date-only comparison

  const updates: { id: string; status: string }[] = [];

  for (const t of tournaments) {
    if (t.status === "cancelled") continue; // Never auto-update cancelled tournaments

    let expectedStatus = t.status;
    const startDate = new Date(t.start_date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(t.start_date);
    endDate.setHours(23, 59, 59, 999);

    const regDeadline = t.registration_deadline ? new Date(t.registration_deadline) : null;
    if (regDeadline) regDeadline.setHours(23, 59, 59, 999);

    if (now > endDate) {
      expectedStatus = "completed";
    } else if (now >= startDate && now <= endDate) {
      expectedStatus = "ongoing";
    } else if (regDeadline && now <= regDeadline) {
      expectedStatus = "registration";
    } else if (now < startDate) {
      expectedStatus = "upcoming";
    }

    if (expectedStatus !== t.status) {
      updates.push({ id: t.id, status: expectedStatus });
    }
  }

  // Execute updates
  for (const update of updates) {
    await supabase.from("tournaments").update({ status: update.status }).eq("id", update.id);
  }
}
