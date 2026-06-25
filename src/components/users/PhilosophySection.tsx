"use client";
import React from "react";

export default function PhilosophySection() {
  return (
    <section className="py-24 md:py-32 lg:py-40 bg-white dark:bg-gray-950 border-b border-[var(--hairline-soft)] dark:border-gray-900">
      <div className="max-w-5xl mx-auto px-4 md:px-8 text-center flex flex-col items-center">
        {/* Decorative thin line */}
        <div className="w-[1px] h-16 md:h-24 bg-[var(--ink)] dark:bg-white/20 mb-8 md:mb-12 opacity-50"></div>
        
        <p className="text-[var(--mute)] text-xs md:text-sm font-ui font-medium uppercase tracking-[0.2em] mb-6 md:mb-10">
          Filosofi Kami
        </p>
        
        <h2 className="font-campaign text-3xl md:text-5xl lg:text-6xl text-[var(--ink)] dark:text-white leading-[1.3] md:leading-[1.2] tracking-tight text-balance">
          "LEBIH DARI SEKEDAR OLAHRAGA. INI TENTANG DEDIKASI, KOMUNITAS, DAN SEMANGAT UNTUK TERUS BERKEMBANG BERSAMA."
        </h2>
        
        {/* Subtle detail */}
        <div className="mt-10 md:mt-16 flex items-center justify-center gap-4 text-[var(--mute)]">
          <span className="w-12 h-[1px] bg-[var(--hairline)] dark:bg-white/10"></span>
          <span className="font-ui text-sm italic">Est. 2019</span>
          <span className="w-12 h-[1px] bg-[var(--hairline)] dark:bg-white/10"></span>
        </div>
      </div>
    </section>
  );
}
