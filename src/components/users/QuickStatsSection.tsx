"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type Stat = {
  label: string;
  value: number;
  suffix: string;
  prefix?: string;
};

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (target === 0) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out quad
            const eased = 1 - (1 - progress) * (1 - progress);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function StatCounter({ stat }: { stat: Stat }) {
  const { count, ref } = useCountUp(stat.value, 1400);
  return (
    <div
      ref={ref}
      className="flex flex-col items-center"
    >
      <div className="text-4xl md:text-5xl lg:text-6xl font-campaign text-[var(--ink)] dark:text-white mb-2">
        {stat.prefix || ""}{count}{stat.suffix}
      </div>
      <div className="text-xs md:text-sm font-ui text-[var(--mute)] font-medium uppercase tracking-wider">{stat.label}</div>
    </div>
  );
}

export default function QuickStatsSection() {
  const [stats, setStats] = useState<Stat[]>([
    { label: "Pemain Terdaftar", value: 0, suffix: "+" },
    { label: "Turnamen Digelar", value: 0, suffix: "+" },
    { label: "Pertandingan Total", value: 0, suffix: "+" },
    { label: "Tahun Berdiri", value: 0, suffix: " Thn" },
  ]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchStats() {
      const [playersRes, tournamentsRes, matchesRes] = await Promise.all([
        supabase.from("profile").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("tournaments").select("id", { count: "exact", head: true }),
        supabase.from("matches").select("id", { count: "exact", head: true }),
      ]);

      setStats([
        { label: "Pemain Terdaftar", value: playersRes.count || 0, suffix: "+" },
        { label: "Turnamen Digelar", value: tournamentsRes.count || 0, suffix: "+" },
        { label: "Pertandingan Total", value: matchesRes.count || 0, suffix: "+" },
        { label: "Tahun Berdiri", value: new Date().getFullYear() - 2019, suffix: " Thn" },
      ]);
      setLoading(false);
    }
    fetchStats();
  }, [supabase]);

  return (
    <section
      id="quick-stats"
      aria-label="Statistik Cepat"
      className="bg-white dark:bg-gray-950 border-b border-[var(--hairline-soft)] dark:border-gray-900"
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 xl:px-16">
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border-r border-[var(--hairline-soft)] dark:border-gray-900 last:border-r-0 px-6 py-10 md:py-16 flex flex-col items-center gap-2">
                <div className="skeleton h-12 w-24 rounded" />
                <div className="skeleton h-4 w-28 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div
                key={s.label}
                className="group relative border-r border-b lg:border-b-0 border-[var(--hairline-soft)] dark:border-gray-900 lg:last:border-r-0 px-6 md:px-10 py-10 md:py-16 flex flex-col items-center text-center hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-500"
              >
                <StatCounter stat={s} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
