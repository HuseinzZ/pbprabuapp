import { createClient } from "@/lib/supabase/server";
import Calendar from "@/components/calendar/Calendar";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default async function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, start_date, end_date, level")
    .order("start_date", { ascending: true });

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Kalender" />
      <Calendar initialEvents={events ?? []}>
        {children}
      </Calendar>
    </div>
  );
}
