"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Tournament = {
  id: string;
  name: string;
  status: "upcoming" | "ongoing" | "completed";
  location: string;
  start_date: string;
  max_participants: number;
  prize_pool: number;
};

const STATUS_LABEL: Record<string, string> = {
  upcoming: "Akan Datang",
  ongoing: "Berlangsung",
  completed: "Selesai",
};

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  ongoing: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  completed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const GRADIENT_COLORS = [
  "from-gray-900 to-gray-800",
  "from-zinc-900 to-neutral-800",
  "from-stone-900 to-stone-800",
];

function formatRupiah(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function LiveTournamentsSection() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("tournaments")
        .select("id, name, status, location, start_date, max_participants, prize_pool")
        .in("status", ["upcoming", "ongoing"])
        .order("start_date", { ascending: true })
        .limit(3);
      setTournaments(data || []);
      setLoading(false);
    }
    fetch();
  }, [supabase]);

  if (!loading && tournaments.length === 0) return null;

  return (
    <section
      id="live-tournaments"
      aria-label="Turnamen Aktif"
      className="py-[var(--sp-section)] bg-white dark:bg-gray-950 border-b border-[var(--hairline-soft)] dark:border-gray-900"
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 xl:px-16">
        {/* Section header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[var(--mute)] text-xs font-ui font-semibold uppercase tracking-widest mb-2">
              Kompetisi
            </p>
            <h2 className="text-4xl md:text-5xl font-campaign text-[var(--ink)] dark:text-white tracking-tight">
              TURNAMEN MENDATANG
            </h2>
          </div>
          <Link
            href="/tournaments"
            className="hidden sm:flex items-center gap-2 text-sm font-medium font-ui text-[var(--ink)] dark:text-white hover:opacity-70 transition-opacity"
          >
            Lihat Semua
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border border-[var(--hairline-soft)] dark:border-gray-800 p-8 md:p-10">
                  <div className="skeleton h-4 w-24 rounded mb-4" />
                  <div className="skeleton h-8 w-full rounded mb-3" />
                  <div className="skeleton h-4 w-3/4 rounded mb-10" />
                  <div className="skeleton h-10 w-32 rounded-full" />
                </div>
              ))
            : tournaments.map((t, i) => (
                <article
                  key={t.id}
                  className="group border border-[var(--hairline-soft)] dark:border-gray-800 p-8 md:p-10 flex flex-col bg-white dark:bg-gray-900 transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Status badge */}
                  <span
                    className={`inline-block self-start px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold font-ui mb-6 ${STATUS_COLORS[t.status]}`}
                  >
                    {STATUS_LABEL[t.status]}
                  </span>

                  <h3 className="text-[var(--ink)] dark:text-white font-campaign text-3xl leading-[1.2] mb-4">
                    {t.name}
                  </h3>

                  <div className="flex flex-col gap-2 text-[var(--charcoal)] dark:text-gray-400 text-sm font-ui mb-10 flex-1">
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[var(--mute)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {new Date(t.start_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[var(--mute)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {t.location || "Lokasi belum ditentukan"}
                    </span>
                    {t.prize_pool > 0 && (
                      <span className="flex items-center gap-2 mt-1 font-medium text-[var(--ink)] dark:text-white">
                        <svg className="w-4 h-4 text-[var(--mute)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {formatRupiah(t.prize_pool)}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/tournaments`}
                    className="btn-secondary self-start !text-sm font-ui border border-[var(--hairline)]"
                  >
                    Lihat Detail
                  </Link>
                </article>
              ))}
        </div>

        {/* Mobile see all */}
        <div className="sm:hidden mt-8 text-center">
          <Link href="/tournaments" className="btn-secondary font-ui w-full border border-[var(--hairline)]">
            Semua Turnamen
          </Link>
        </div>
      </div>
    </section>
  );
}
