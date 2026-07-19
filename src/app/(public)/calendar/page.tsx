"use client";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventContentArg } from "@fullcalendar/core";
import idLocale from "@fullcalendar/core/locales/id";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import SponsorSection from "@/components/users/SponsorSection";
import Loader from "@/components/shared/Loader";

export default function PublicCalendarPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<{ title: string; start: string | Date; allDay?: boolean } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchEvents() {
      // Fetch from both events table and matches table
      const [eventsRes, matchesRes] = await Promise.all([
        supabase.from("events").select("*"),
        supabase
          .from("matches")
          .select("id, match_date, status, tournaments(name)")
          .not("match_date", "is", null)
          .order("match_date", { ascending: true }),
      ]);

      if (eventsRes.error && matchesRes.error) {
        toast.error("Gagal memuat data kalender.");
      }

      const formattedEvents: any[] = [];

      // Events table
      if (eventsRes.data) {
        eventsRes.data.forEach((e: any) => {
          formattedEvents.push({
            id: `event-${e.id}`,
            title: e.title,
            start: e.start_date,
            end: e.end_date ?? undefined,
            allDay: true,
            extendedProps: { type: "event", calendar: e.level ?? "Primary" },
          });
        });
      }

      // Matches table — scheduled/upcoming
      if (matchesRes.data) {
        matchesRes.data.forEach((m: any) => {
          let calClass = "Primary";
          if (m.status === "completed") calClass = "Success";
          else if (m.status === "ongoing") calClass = "Danger";
          else calClass = "Warning"; // scheduled

          formattedEvents.push({
            id: `match-${m.id}`,
            title: m.tournaments?.name ? `🏸 ${m.tournaments.name}` : "🏸 Pertandingan",
            start: m.match_date,
            extendedProps: { type: "match", status: m.status, calendar: calClass },
          });
        });
      }

      setEvents(formattedEvents);
      setLoading(false);
    }
    fetchEvents();
  }, [supabase]);

  const renderEventContent = (eventInfo: EventContentArg) => {
    const calendarType = eventInfo.event.extendedProps.calendar || "Primary";
    const colorClass = `fc-bg-${calendarType.toLowerCase()}`;
    return (
      <div className={`event-fc-color flex items-center fc-event-main ${colorClass} p-1 rounded-sm w-full truncate`}>
        <div className="fc-daygrid-event-dot shrink-0" />
        <div className="fc-event-time font-medium shrink-0">{eventInfo.timeText}</div>
        <div className="fc-event-title font-semibold truncate ml-1 text-slate-800 dark:text-zinc-200">{eventInfo.event.title}</div>
      </div>
    );
  };

  return (
    <div className="pt-24 md:pt-32 pb-16 px-4 md:px-8 xl:px-16 max-w-[1440px] mx-auto min-h-screen page-fade-in">
      {/* Header */}
      <div className="mb-12 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">Kalender</h1>
        <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
          Jadwal latihan, turnamen, dan kegiatan komunitas
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap mb-6">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-error-500" />
          <span className="text-xs font-semibold text-slate-500">Penting</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-xs font-semibold text-slate-500">Sedang</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-brand-500" />
          <span className="text-xs font-semibold text-slate-500">Biasa</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-success-500" />
          <span className="text-xs font-semibold text-slate-500">Informasi</span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-[var(--hairline-soft)] dark:border-gray-800 rounded-2xl overflow-hidden p-4 md:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Loader />
          </div>
        ) : (
          <div className="custom-calendar font-ui">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={idLocale}
              firstDay={1}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
              }}
              events={events}
              selectable={false}
              eventContent={renderEventContent}
              eventClick={(info) => {
                setSelectedEvent({
                  title: info.event.title,
                  start: info.event.start || new Date(),
                  allDay: info.event.allDay
                });
              }}
              height="auto"
              eventDisplay="block"
              className="cursor-pointer"
            />
          </div>
        )}
      </div>
      
      <div className="mt-16">
        <SponsorSection />
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white">Detail Jadwal</h3>
              <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-500 text-xl font-semibold leading-none cursor-pointer">&times;</button>
            </div>
            <div className="p-5 space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Kegiatan</div>
                <div className="font-medium text-gray-900 dark:text-white">{selectedEvent.title}</div>
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Tanggal</div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {new Date(selectedEvent.start).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <button onClick={() => setSelectedEvent(null)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer">Tutup</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
