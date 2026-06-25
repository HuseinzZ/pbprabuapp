"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Player = {
  id: string;
  fullname: string;
  username: string | null;
  level: string | null;
  ranking_points: number;
  avatar_url: string | null;
};

const MEDAL = ["🥇", "🥈", "🥉"];
const PODIUM_HEIGHT = ["h-32", "h-24", "h-20"];
const PODIUM_ORDER = [1, 0, 2]; // Silver, Gold, Bronze visual order

export default function TopRankingsPreview() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("profile")
        .select("id, fullname, username, level, ranking_points, avatar_url")
        .eq("is_active", true)
        .order("ranking_points", { ascending: false })
        .limit(5);
      setPlayers(data || []);
      setLoading(false);
    }
    fetch();
  }, [supabase]);

  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <section
      id="top-rankings"
      aria-label="Top Rankings Preview"
      className="py-[var(--sp-section)] bg-[var(--canvas)] dark:bg-gray-950"
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 xl:px-16">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-[var(--mute)] text-xs font-ui font-semibold uppercase tracking-widest mb-2">
              Papan Peringkat
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--ink)] dark:text-white tracking-tight font-ui">
              Top 5 Pemain
            </h2>
          </div>
          <Link
            href="/rankings"
            className="hidden sm:flex items-center gap-1 text-sm font-medium font-ui text-[var(--mute)] hover:text-[var(--ink)] dark:hover:text-white transition-colors"
          >
            Leaderboard Lengkap
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border border-[var(--hairline-soft)] rounded-xl">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/3 rounded" />
                  <div className="skeleton h-3 w-1/5 rounded" />
                </div>
                <div className="skeleton h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {top3.length >= 2 && (
              <div className="hidden md:flex items-end justify-center gap-2 mb-12">
                {PODIUM_ORDER.map((rankIndex) => {
                  const p = top3[rankIndex];
                  if (!p) return null;
                  const isGold = rankIndex === 0;
                  return (
                    <div key={p.id} className="flex flex-col items-center">
                      {/* Avatar */}
                      <div
                        className={`relative mb-3 ${isGold ? "w-20 h-20" : "w-16 h-16"} rounded-full flex items-center justify-center font-bold text-white font-ui text-xl ${
                          rankIndex === 0
                            ? "bg-[var(--ink)] ring-4 ring-[var(--ink)] ring-offset-2 ring-offset-white dark:ring-offset-gray-950"
                            : rankIndex === 1
                            ? "bg-[var(--charcoal)]"
                            : "bg-[var(--ash)]"
                        }`}
                      >
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt={p.fullname} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          p.fullname.charAt(0)
                        )}
                        <span className="absolute -top-2 -right-1 text-lg leading-none">
                          {MEDAL[rankIndex]}
                        </span>
                      </div>
                      {/* Name */}
                      <p className={`font-semibold font-ui text-center mb-1 ${isGold ? "text-[var(--ink)] dark:text-white text-base" : "text-[var(--charcoal)] dark:text-gray-300 text-sm"}`}>
                        {p.fullname.split(" ")[0]}
                      </p>
                      <p className="text-[var(--mute)] font-ui text-xs mb-3">{p.ranking_points} pts</p>
                      {/* Podium block */}
                      <div
                        className={`${PODIUM_HEIGHT[rankIndex]} w-28 flex items-start justify-center pt-3 ${
                          rankIndex === 0 ? "bg-[var(--ink)]" : "bg-[var(--soft-cloud)] dark:bg-gray-800"
                        } rounded-t-lg`}
                      >
                        <span className={`font-campaign text-2xl ${rankIndex === 0 ? "text-white" : "text-[var(--stone)]"}`}>
                          #{rankIndex + 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* List — all 5 */}
            <div className="space-y-2">
              {players.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 px-5 py-4 border border-[var(--hairline-soft)] dark:border-gray-800 rounded-xl hover:border-[var(--hairline)] dark:hover:border-gray-600 transition-colors"
                >
                  <span className="w-6 text-center font-campaign text-lg text-[var(--mute)]">
                    {i < 3 ? MEDAL[i] : `#${i + 1}`}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-[var(--soft-cloud)] dark:bg-gray-800 flex items-center justify-center font-bold font-ui text-[var(--ink)] dark:text-white text-sm shrink-0">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.fullname} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      p.fullname.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold font-ui text-[var(--ink)] dark:text-white text-sm truncate">{p.fullname}</p>
                    {p.level && (
                      <p className="text-[var(--mute)] text-xs font-ui">{p.level}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold font-ui text-[var(--ink)] dark:text-white text-sm">{p.ranking_points}</p>
                    <p className="text-[var(--stone)] text-xs font-ui">poin</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile CTA */}
            <div className="mt-8 flex justify-center">
              <Link href="/rankings" className="btn-primary font-ui">
                Lihat Leaderboard Lengkap
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
