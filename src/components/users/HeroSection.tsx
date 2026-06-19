"use client";
import Link from "next/link";
import React, { useState, useEffect, useCallback } from "react";

const slides = [
  {
    src: "/2.jpg",
    title: "Tournament",
  },
  {
    src: "/3.jpeg",
    title: "Tournament",
  },
  {
    src: "/4.png",
    title: "Tournament",
  },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = useCallback((idx: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent(idx);
    setTimeout(() => setIsAnimating(false), 700);
  }, [isAnimating]);

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo]);

  useEffect(() => {
    const timer = setInterval(() => next(), 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section id="home" className="relative w-full overflow-hidden" style={{ marginTop: "100px"}}>
      {/* Slides */}
      <div className="relative w-full h-[55vh] sm:h-[65vh] md:h-[75vh] xl:h-[85vh]">
        {slides.map((slide, idx) => (
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
            {/* Dark overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/70" />


          </div>
        ))}

        {/* Prev / Next buttons */}
        <button
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-black/50 active:bg-black/50 backdrop-blur-md text-white/30 hover:text-white active:text-white border border-transparent hover:border-white/20 active:border-white/20 transition-all duration-300 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-black/50 active:bg-black/50 backdrop-blur-md text-white/30 hover:text-white active:text-white border border-transparent hover:border-white/20 active:border-white/20 transition-all duration-300 hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-5 left-0 right-0 z-20 flex justify-center gap-2.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              aria-label={`Pergi ke slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-400 ${
                idx === current ? "w-8 bg-indigo-500" : "w-2.5 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>


      </div>
    </section>
  );
}
