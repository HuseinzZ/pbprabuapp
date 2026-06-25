"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Match = {
  id: string;
  match_date: string;
  team1_score: number;
  team2_score: number;
  status: string;
  tournament_id: string | null;
  tournaments?: { name: string } | null;
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RecentMatchesSection() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("matches")
        .select("id, match_date, team1_score, team2_score, status, tournament_id, tournaments(name)")
        .eq("status", "completed")
        .order("match_date", { ascending: false })
        .limit(4);
      setMatches((data as any) || []);
      setLoading(false);
    }
    fetch();
  }, [supabase]);

  if (!loading && matches.length === 0) return null;

  return (
    <section
      id="recent-matches"
      aria-label="Pertandingan Terbaru"
      className="py-[var(--sp-section)] bg-white dark:bg-gray-950 border-b border-[var(--hairline-soft)] dark:border-gray-900"
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 xl:px-16">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[var(--mute)] text-xs font-ui font-semibold uppercase tracking-widest mb-2">
              Hasil Pertandingan
            </p>
            <h2 className="text-4xl md:text-5xl font-campaign text-[var(--ink)] dark:text-white tracking-tight">
              LAGA TERBARU
            </h2>
          </div>
          <Link
            href="/matches"
            className="hidden sm:flex items-center gap-2 text-sm font-medium font-ui text-[var(--ink)] dark:text-white hover:opacity-70 transition-opacity"
          >
            Jadwal Lengkap
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 border border-[var(--hairline-soft)] dark:border-gray-800 p-8">
                  <div className="skeleton h-3 w-20 rounded mb-6" />
                  <div className="flex items-center justify-between mb-6">
                    <div className="skeleton h-10 w-10 rounded-full" />
                    <div className="skeleton h-8 w-20 rounded" />
                    <div className="skeleton h-10 w-10 rounded-full" />
                  </div>
                  <div className="skeleton h-3 w-full rounded" />
                </div>
              ))
            : matches.map((m) => {
                const team1Win = m.team1_score > m.team2_score;
                const team2Win = m.team2_score > m.team1_score;
                return (
                  <article
                    key={m.id}
                    className="group bg-white dark:bg-gray-900 border border-[var(--hairline-soft)] dark:border-gray-800 p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
                  >
                    {/* Tournament label */}
                    {m.tournaments?.name && (
                      <p className="text-[var(--stone)] text-[10px] font-ui font-semibold uppercase tracking-[0.15em] mb-5 truncate text-center">
                        {m.tournaments.name}
                      </p>
                    )}

                    {/* Score */}
                    <div className="flex items-center justify-between gap-2 mb-6">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-ui border transition-colors ${team1Win ? "bg-[var(--ink)] text-white border-[var(--ink)]" : "bg-transparent border-[var(--hairline)] text-[var(--mute)]"}`}>
                        T1
                      </div>
                      <div className="flex items-center gap-2 font-campaign text-3xl md:text-4xl text-[var(--ink)] dark:text-white">
                        <span>{m.team1_score}</span>
                        <span className="text-[var(--hairline)] font-ui font-light text-xl">—</span>
                        <span>{m.team2_score}</span>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-ui border transition-colors ${team2Win ? "bg-[var(--ink)] text-white border-[var(--ink)]" : "bg-transparent border-[var(--hairline)] text-[var(--mute)]"}`}>
                        T2
                      </div>
                    </div>

                    {/* Date */}
                    <div className="pt-4 border-t border-[var(--hairline-soft)] dark:border-gray-800 text-[var(--stone)] text-xs font-ui text-center">
                      {formatDate(m.match_date)}
                    </div>
                  </article>
                );
              })}
        </div>

        <div className="mt-8 flex justify-center sm:hidden">
          <Link href="/matches" className="btn-secondary font-ui w-full border border-[var(--hairline)]">
            Jadwal Lengkap
          </Link>
        </div>
      </div>
    </section>
  );
}
