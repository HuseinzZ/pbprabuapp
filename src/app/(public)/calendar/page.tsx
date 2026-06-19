"use client";
import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { EventContentArg } from "@fullcalendar/core";
import idLocale from "@fullcalendar/core/locales/id";
import { createClient } from "@/lib/supabase/client";
import Loader from "@/components/shared/Loader";

export default function PublicCalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchEvents() {
      const { data } = await supabase.from("events").select("*");
      if (data) {
        const formattedEvents = data.map((e) => ({
          id: e.id,
          title: e.title,
          start: e.start_date,
          end: e.end_date ?? undefined,
          allDay: true,
          extendedProps: { calendar: e.level ?? "Primary" },
        }));
        setEvents(formattedEvents);
      }
      setLoading(false);
    }
    fetchEvents();
  }, [supabase]);

  const renderEventContent = (eventInfo: EventContentArg) => {
    const level = eventInfo.event.extendedProps.calendar || "Primary";
    const colorClass = `fc-bg-${level.toLowerCase()}`;
    return (
      <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm w-full overflow-hidden text-xs truncate`}>
        <div className="fc-event-title font-medium">{eventInfo.event.title}</div>
      </div>
    );
  };

  return (
    <div className="pt-24 pb-12 px-4 md:px-8 xl:px-16 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Kalender PB Prabu</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Jadwal latihan, turnamen, dan kegiatan komunitas
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden p-4 md:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] w-full"><Loader /></div>
        ) : (
          <div className="custom-calendar">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView="dayGridMonth"
              locale={idLocale}
              firstDay={1}
              headerToolbar={{
                left: "prev,next",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              selectable={false}
              eventContent={renderEventContent}
              height="auto"
            />
          </div>
        )}
      </div>
    </div>
  );
}
