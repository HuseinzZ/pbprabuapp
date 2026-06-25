"use client";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const DEFAULT_SLIDES = [
  { src: "/2.jpg", title: "Badminton Competition" },
  { src: "/3.jpeg", title: "Tournament Finals" },
  { src: "/4.png", title: "Community Event" },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [heroTitle, setHeroTitle] = useState("KOMPETISI\nBERKELAS");
  const [heroSubtitle, setHeroSubtitle] = useState("Turnamen · Ranking · Jadwal");

  const supabase = createClient();

  // Fetch latest active tournament name for dynamic hero copy
  useEffect(() => {
    async function fetchHero() {
      const { data } = await supabase
        .from("tournaments")
        .select("name")
        .eq("status", "ongoing")
        .order("start_date", { ascending: false })
        .limit(1);

      if (data && data[0]) {
        setHeroTitle(data[0].name.toUpperCase());
        setHeroSubtitle("Turnamen Sedang Berlangsung · Daftarkan Diri Anda");
      }
    }
    fetchHero();
  }, [supabase]);

  const goTo = useCallback(
    (idx: number) => {
      if (isAnimating) return;
      setIsAnimating(true);
      setCurrent(idx);
      setTimeout(() => setIsAnimating(false), 700);
    },
    [isAnimating]
  );

  const prev = () => goTo((current - 1 + DEFAULT_SLIDES.length) % DEFAULT_SLIDES.length);
  const next = useCallback(
    () => goTo((current + 1) % DEFAULT_SLIDES.length),
    [current, goTo]
  );

  useEffect(() => {
    const timer = setInterval(() => next(), 5500);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section
      id="home"
      aria-label="Hero Section"
      className="relative w-full overflow-hidden"
      style={{ marginTop: "64px" }}
    >
      {/* Slides */}
      <div className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] xl:h-[92vh]">
        {DEFAULT_SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <img
              src={slide.src}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          </div>
        ))}

        {/* ── Editorial Campaign Headline (DESIGN.md spec) ── */}
        <div className="absolute bottom-0 left-0 z-20 p-6 md:p-10 xl:p-16 max-w-4xl flex flex-col justify-end h-full">
          <div className="animate-fade-in-up" style={{ animationDuration: '1s', animationFillMode: 'both' }}>
            <p className="text-white/60 text-xs md:text-sm font-ui font-semibold tracking-[0.2em] uppercase mb-4">
              PB Prabu Bandung
            </p>
            <h1
              className="font-campaign text-white leading-[1.1] mb-6 whitespace-pre-line text-5xl md:text-7xl lg:text-[96px]"
              style={{ textShadow: "0 4px 40px rgba(0,0,0,0.5)" }}
            >
              {heroTitle}
            </h1>
            <p className="text-white/80 font-ui text-base md:text-xl mb-10 max-w-lg font-light leading-relaxed">
              {heroSubtitle}
            </p>

            {/* CTAs — pill shaped per DESIGN.md */}
            <div className="flex flex-wrap gap-4">
              <Link href="/tournaments" className="btn-outline-on-image font-ui px-8 py-3 text-sm md:text-base">
                Lihat Turnamen
              </Link>
              <Link href="/rankings" className="btn-secondary font-ui px-8 py-3 text-sm md:text-base bg-white text-black hover:bg-gray-100 border-transparent">
                Lihat Ranking
              </Link>
            </div>
          </div>
        </div>

        {/* Prev / Next controls */}
        <button
          onClick={prev}
          aria-label="Slide sebelumnya"
          className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm text-white border border-white/20 transition-all duration-200 hover:scale-105"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={next}
          aria-label="Slide berikutnya"
          className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm text-white border border-white/20 transition-all duration-200 hover:scale-105"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-6 right-6 md:right-10 z-20 flex gap-2">
          {DEFAULT_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              aria-label={`Slide ${idx + 1}`}
              className={`h-[3px] rounded-full transition-all duration-400 ${
                idx === current ? "w-8 bg-white" : "w-3 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
