"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import idLocale from "@fullcalendar/core/locales/id";
import { Modal } from "@/components/ui/modal/modal";
import { createClient } from "@/lib/supabase/client";
import Loader from "@/components/shared/Loader";
import DatePicker from "@/components/form/DatePicker";
import { useRouter, useSearchParams, usePathname, useParams } from "next/navigation";
import { AlertCircle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DbEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  level: string;
}

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    dbId?: string;
  };
}

interface CalendarProps {
  initialEvents?: DbEvent[];
  children?: React.ReactNode;
}

// ─── Level / colour mapping ───────────────────────────────────────────────────

const calendarsEvents: Record<string, { color: string; label: string }> = {
  Danger: { color: "danger", label: "Penting" },
  Warning: { color: "warning", label: "Sedang" },
  Primary: { color: "primary", label: "Biasa" },
  Success: { color: "success", label: "Informasi" },
};

const dbToCalendar = (e: DbEvent): CalendarEvent => ({
  id: e.id,
  title: e.title,
  start: e.start_date,
  end: e.end_date ?? undefined,
  allDay: true,
  extendedProps: { calendar: e.level ?? "Primary", dbId: e.id },
});

// ─── Component ────────────────────────────────────────────────────────────────

const Calendar: React.FC<CalendarProps> = ({ initialEvents = [], children }) => {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const params = useParams();

  // Determine mode and eventId from URL directly
  const mode = pathname.includes("/add")
    ? "add"
    : pathname.includes("/edit/")
      ? "edit"
      : pathname.includes("/delete/")
        ? "delete"
        : undefined;

  const eventId = params.id as string | undefined;

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLevel, setEventLevel] = useState("Primary");
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // ─── Loading states ───────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const calendarRef = useRef<FullCalendar>(null);

  // Seed from server-fetched data
  useEffect(() => {
    setEvents(initialEvents.map(dbToCalendar));
  }, [initialEvents]);

  // Handle modal state and load data based on router mode & eventId
  useEffect(() => {
    if (mode === "add") {
      const start = searchParams.get("start") || "";
      const end = searchParams.get("end") || "";
      setEventTitle("");
      
      const startDate = start.includes("T") ? start.split("T")[0] : start.split(" ")[0];
      const endDate = end.includes("T") ? end.split("T")[0] : end.split(" ")[0];

      setEventStartDate(startDate);
      setEventEndDate(endDate || startDate);
      setEventLevel("Primary");
      setSelectedEvent(null);
    } else if ((mode === "edit" || mode === "delete") && eventId && events.length > 0) {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        setSelectedEvent(event);
        setEventTitle(event.title || "");

        const startStr = event.start?.toString() || "";
        const endStr = event.end?.toString() || "";

        const startDate = startStr.includes("T") ? startStr.split("T")[0] : startStr.split(" ")[0];
        const endDate = endStr.includes("T") ? endStr.split("T")[0] : endStr.split(" ")[0];

        setEventStartDate(startDate);
        setEventEndDate(endDate);
        setEventLevel(event.extendedProps.calendar ?? "Primary");
      }
    } else if (!mode) {
      setSelectedEvent(null);
      setEventTitle("");
      setEventStartDate("");
      setEventEndDate("");
      setEventLevel("Primary");
    }
  }, [mode, eventId, events, searchParams]);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    router.push(
      `/admin/calendar/add?start=${selectInfo.startStr}&end=${selectInfo.endStr || selectInfo.startStr}`
    );
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    router.push(`/admin/calendar/edit/${clickInfo.event.id}`);
  };

  const handleCloseModal = () => {
    if (isSaving || isDeleting) return;
    router.push("/admin/calendar");
  };

  // ─── SIMPAN (Tambah / Edit) ───────────────────────────────────────────────
  const handleAddOrUpdateEvent = async () => {
    if (!eventTitle.trim()) return;
    setIsSaving(true);

    try {
      if (selectedEvent) {
        // ── Edit ──
        const dbId = selectedEvent.extendedProps?.dbId ?? selectedEvent.id;
        const { error } = await supabase
          .from("events")
          .update({
            title: eventTitle,
            start_date: eventStartDate,
            end_date: eventEndDate || null,
            level: eventLevel,
            updated_at: new Date().toISOString(),
          })
          .eq("id", dbId);

        if (!error) {
          setEvents((prev) =>
            prev.map((e) =>
              e.id === selectedEvent.id
                ? {
                  ...e,
                  title: eventTitle,
                  start: eventStartDate,
                  end: eventEndDate || undefined,
                  allDay: true,
                  extendedProps: { calendar: eventLevel, dbId },
                }
                : e
            )
          );
          router.push("/admin/calendar");
          router.refresh();
        }
      } else {
        // ── Tambah ──
        const { data, error } = await supabase
          .from("events")
          .insert({
            title: eventTitle,
            start_date: eventStartDate,
            end_date: eventEndDate || null,
            level: eventLevel,
          })
          .select()
          .single();

        if (!error && data) {
          const newEvent: CalendarEvent = {
            id: data.id,
            title: eventTitle,
            start: eventStartDate,
            end: eventEndDate || undefined,
            allDay: true,
            extendedProps: { calendar: eventLevel, dbId: data.id },
          };
          setEvents((prev) => [...prev, newEvent]);
          router.push("/admin/calendar");
          router.refresh();
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ─── HAPUS ───────────────────────────────────────────────────────────────
  const handleDeleteEvent = useCallback(async () => {
    if (!selectedEvent) return;
    setIsDeleting(true);
    try {
      const dbId = selectedEvent.extendedProps?.dbId ?? selectedEvent.id;
      const { error } = await supabase.from("events").delete().eq("id", dbId);
      if (!error) {
        setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
        router.push("/admin/calendar");
        router.refresh();
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedEvent, supabase, router]);

  const isLoading = isSaving || isDeleting;

  return (
    <>
      <div className="relative rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* ─── Loader Overlay — hanya menutupi area kalender ──────────────────── */}
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm rounded-2xl">
            <Loader />
          </div>
        )}
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale={idLocale}
            firstDay={1}
            headerToolbar={{
              left: "prev,next addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              addEventButton: {
                text: "Tambah Event +",
                click: () => router.push("/admin/calendar/add"),
              },
            }}
          />
        </div>

        {/* ─── Modal Tambah / Edit ──────────────────────────────────────────── */}
        <Modal
          isOpen={mode === "add" || mode === "edit"}
          onClose={handleCloseModal}
          className="max-w-[700px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 lg:p-10"
        >
          <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                {selectedEvent ? "Edit Event" : "Tambah Event"}
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {selectedEvent
                  ? "Ubah informasi event yang sudah ada"
                  : "Jadwalkan event baru di kalender"}
              </p>
            </div>

            <div className="mt-8 space-y-6">
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Judul Event
                </label>
                <input
                  id="event-title"
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Judul event..."
                  disabled={isLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-shadow disabled:opacity-50"
                />
              </div>

              {/* Level / Color */}
              <div>
                <label className="block mb-4 text-sm font-medium text-gray-700 dark:text-gray-400">
                  Tingkat Kepentingan
                </label>
                <div className="flex flex-wrap items-center gap-4 sm:gap-5">
                  {Object.entries(calendarsEvents).map(([key, value]) => (
                    <div key={key} className="n-chk">
                      <div className={`form-check form-check-${value.color} form-check-inline`}>
                        <label
                          className="flex items-center text-sm text-gray-700 form-check-label dark:text-gray-400 font-medium"
                          htmlFor={`modal${key}`}
                        >
                          <span className="relative">
                            <input
                              className="sr-only form-check-input"
                              type="radio"
                              name="event-level"
                              value={key}
                              id={`modal${key}`}
                              checked={eventLevel === key}
                              onChange={() => setEventLevel(key)}
                              disabled={isLoading}
                            />
                            <span className="flex items-center justify-center w-5 h-5 mr-2 border border-gray-300 rounded-full box dark:border-gray-700">
                              <span className={`h-2 w-2 rounded-full bg-white ${eventLevel === key ? "block" : "hidden"}`} />
                            </span>
                          </span>
                          {value.label}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tanggal Mulai */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Tanggal Mulai
                </label>
                <DatePicker
                  id="event-start-date"
                  value={eventStartDate}
                  onChange={setEventStartDate}
                  placeholder="Pilih tanggal mulai"
                />
              </div>

              {/* Tanggal Selesai */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Tanggal Selesai
                </label>
                <DatePicker
                  id="event-end-date"
                  value={eventEndDate}
                  onChange={setEventEndDate}
                  placeholder="Pilih tanggal selesai"
                />
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex items-center gap-3 mt-6 modal-footer sm:justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
              {selectedEvent && (
                <button
                  onClick={() => router.push(`/admin/calendar/delete/${selectedEvent.extendedProps?.dbId || selectedEvent.id}`)}
                  disabled={isLoading}
                  type="button"
                  className="flex w-full justify-center px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-sm sm:w-auto"
                >
                  Hapus
                </button>
              )}
              <button
                onClick={handleCloseModal}
                disabled={isLoading}
                type="button"
                className="flex w-full justify-center px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 sm:w-auto"
              >
                Tutup
              </button>
              <button
                onClick={handleAddOrUpdateEvent}
                disabled={isLoading || !eventTitle.trim()}
                type="button"
                className="flex w-full justify-center px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-sm sm:w-auto"
              >
                {isSaving ? "Menyimpan..." : selectedEvent ? "Simpan Perubahan" : "Tambah Event"}
              </button>
            </div>
          </div>
        </Modal>

        {/* ─── Modal Hapus Konfirmasi ────────────────────────────────────────── */}
        <Modal
          isOpen={mode === "delete"}
          onClose={handleCloseModal}
          className="max-w-sm w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 mx-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-500/10">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Hapus Event
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tindakan ini tidak dapat dibatalkan
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
            Yakin ingin menghapus{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {eventTitle}
            </span>
            ?
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleCloseModal}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteEvent}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </Modal>
        {children}
      </div>
    </>
  );
};

const CalendarWithSuspense: React.FC<CalendarProps> = (props) => (
  <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader /></div>}>
    <Calendar {...props} />
  </Suspense>
);

const renderEventContent = (eventInfo: EventContentArg) => {
  const colorClass = `fc-bg-${eventInfo.event.extendedProps.calendar.toLowerCase()}`;
  return (
    <div className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}>
      <div className="fc-daygrid-event-dot" />
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{eventInfo.event.title}</div>
    </div>
  );
};

export default CalendarWithSuspense;
