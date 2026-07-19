"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  ChevronLeft, ChevronRight, Maximize2, Loader2,
  Play, Pause, ZoomIn, ZoomOut, Maximize, Minimize, LayoutGrid, X, ImageIcon
} from "lucide-react";
import { GalleryItem, GalleryCategory, CATEGORY_LABELS, CATEGORY_COLORS } from "@/app/admin/gallery/types";
import { createClient } from "@/lib/supabase/client";
import SponsorSection from "@/components/users/SponsorSection";
import Loader from "@/components/shared/Loader";

// ─── URL resolver ──────────────────────────────────────────────────────────────

function getImageUrl(url: string): string {
  if (!url) return "/1.png";
  if (url.startsWith("http") || url.startsWith("/")) return url;
  if (!url.includes("/")) return `/${url}`;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) {
    const path = url.startsWith("gallery/") ? url : `gallery/${url}`;
    return `${supabaseUrl}/storage/v1/object/public/${path}`;
  }
  return `/${url}`;
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

interface LightboxProps {
  items: GalleryItem[];
  initialIndex: number;
  onClose: () => void;
}

const PLAY_INTERVAL = 3000;

function Lightbox({ items, initialIndex, onClose }: LightboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(initialIndex);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const item = items[index];

  const prev = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  const next = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(next, PLAY_INTERVAL);
    } else {
      if (playRef.current) clearInterval(playRef.current);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [playing, next]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Gagal fullscreen:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Gagal exit fullscreen:", err);
      });
    }
  };

  function zoomIn() { setZoom((z) => Math.min(z + 0.5, 4)); }
  function zoomOut() { 
    setZoom((z) => {
      const newZoom = Math.max(z - 0.5, 1);
      if (newZoom === 1) setPan({ x: 0, y: 0 });
      return newZoom;
    }); 
  }
  function zoomReset() { setZoom(1); setPan({ x: 0, y: 0 }); }

  const [hasPanned, setHasPanned] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setHasPanned(false);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setHasPanned(true);
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setHasPanned(false);
    dragStart.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoom <= 1) return;
    setHasPanned(true);
    setPan({ x: e.touches[0].clientX - dragStart.current.x, y: e.touches[0].clientY - dragStart.current.y });
  };

  const handleTouchEnd = () => setIsDragging(false);

  if (!mounted || !item) return null;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col select-none justify-between"
    >
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-sm z-20">
        <div className="flex items-center gap-1">
          <button onClick={prev} disabled={items.length <= 1} className="w-8 h-8 flex items-center justify-center rounded text-white hover:bg-white/10 transition-colors disabled:opacity-30">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <span className="text-white text-sm font-medium tabular-nums px-1">
            {index + 1} / {items.length}
          </span>
          <button onClick={next} disabled={items.length <= 1} className="w-8 h-8 flex items-center justify-center rounded text-white hover:bg-white/10 transition-colors disabled:opacity-30">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={zoomOut} disabled={zoom <= 1} title="Zoom out" className="w-8 h-8 flex items-center justify-center rounded text-white hover:bg-white/10 transition-colors disabled:opacity-30">
            <ZoomOut className="w-4 h-4 text-white" />
          </button>
          {zoom !== 1 && (
            <button onClick={zoomReset} title="Reset zoom" className="px-2 h-8 flex items-center justify-center rounded text-white hover:bg-white/10 transition-colors text-xs font-mono">
              {Math.round(zoom * 100)}%
            </button>
          )}
          <button onClick={zoomIn} disabled={zoom >= 4} title="Zoom in" className="w-8 h-8 flex items-center justify-center rounded text-white hover:bg-white/10 transition-colors disabled:opacity-30">
            <ZoomIn className="w-4 h-4 text-white" />
          </button>

          <div className="w-px h-5 bg-white/20 mx-1" />

          <button onClick={() => setPlaying((p) => !p)} disabled={items.length <= 1} title={playing ? "Pause slideshow" : "Play slideshow"} className={`w-8 h-8 flex items-center justify-center rounded transition-colors disabled:opacity-30 ${playing ? "text-white bg-white/20 hover:bg-white/30" : "text-white hover:bg-white/10"}`}>
            {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
          </button>

          <button onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"} className="w-8 h-8 flex items-center justify-center rounded text-white hover:bg-white/10 transition-colors">
            {isFullscreen ? <Minimize className="w-4 h-4 text-white" /> : <Maximize className="w-4 h-4 text-white" />}
          </button>

          <button onClick={() => setShowThumbnails((t) => !t)} disabled={items.length <= 1} title="Thumbnails" className={`w-8 h-8 flex items-center justify-center rounded transition-colors disabled:opacity-30 ${showThumbnails ? "text-white bg-white/20 hover:bg-white/30" : "text-white hover:bg-white/10"}`}>
            <LayoutGrid className="w-4 h-4 text-white" />
          </button>

          <div className="w-px h-5 bg-white/20 mx-1" />

          <button onClick={onClose} title="Tutup (Esc)" className="w-8 h-8 flex items-center justify-center rounded text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center relative overflow-hidden z-10">
        {items.length > 1 && (
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-28 z-20 cursor-pointer flex items-center justify-center group" onClick={prev}>
            <div className="flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-md transition-all text-white">
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 drop-shadow-md" />
            </div>
          </div>
        )}

        <div
          className={`flex-1 flex items-center justify-center h-full px-4 md:px-24 py-4 z-10 ${zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
          onClick={() => {
            if (hasPanned && zoom > 1) {
              setHasPanned(false);
              return;
            }
            zoom < 4 ? zoomIn() : zoomReset();
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="relative flex items-center justify-center w-full h-full max-w-full max-h-full"
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.2s ease-out" 
            }}
          >
            <img
              key={item.id}
              src={getImageUrl(item.image_url)}
              alt={item.title}
              className="object-contain shadow-2xl rounded-sm w-full h-full max-w-full max-h-full"
              style={{ display: "block", userSelect: "none" }}
              draggable={false}
            />
          </div>
        </div>

        {items.length > 1 && (
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-28 z-20 cursor-pointer flex items-center justify-center group" onClick={next}>
            <div className="flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-md transition-all text-white">
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8 drop-shadow-md" />
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 z-20 bg-black/60 backdrop-blur-sm">
        {showThumbnails && items.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto justify-center scrollbar-hide">
            {items.map((it, i) => (
              <button
                key={it.id}
                onClick={() => setIndex(i)}
                className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === index
                    ? "border-brand-500 opacity-100 scale-105 shadow-md"
                    : "border-transparent opacity-40 hover:opacity-75"
                }`}
              >
                <div className="relative w-full h-full">
                  <Image src={getImageUrl(it.image_url)} alt={it.title} fill className="object-cover" unoptimized />
                </div>
              </button>
            ))}
          </div>
        )}

        {playing && (
          <div className="h-1 bg-white/10 w-full">
            <div key={index} className="h-full bg-brand-500" style={{ animation: `slideProgress ${PLAY_INTERVAL}ms linear forwards` }} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>,
    document.body
  );
}

// ─── PublicGalleryClient ───────────────────────────────────────────────────────────────

type FilterType = "all" | GalleryCategory;
const INITIAL_LIMIT = 6;

export default function PublicGalleryClient() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [displayLimit, setDisplayLimit] = useState(INITIAL_LIMIT);

  const supabase = createClient();

  useEffect(() => {
    async function fetchGallery() {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setItems(data);
      }
      setLoading(false);
    }
    fetchGallery();
  }, [supabase]);

  const filtered = activeFilter === "all"
    ? items
    : items.filter((item) => item.category === activeFilter);

  const filters: FilterType[] = ["all", "tournament", "training", "event", "general"];

  return (
    <div className="pt-24 md:pt-32 pb-16 px-4 md:px-8 xl:px-16 max-w-[1440px] mx-auto min-h-screen page-fade-in">
      {/* Header */}
      <div className="mb-12 max-w-3xl mx-auto text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
          Galeri
        </h1>
        <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">Kumpulan foto kegiatan turnamen</p>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          items={filtered}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader />
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-2 overflow-x-auto mb-8 pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style dangerouslySetInnerHTML={{__html: `
              .scrollbar-hide::-webkit-scrollbar { display: none; }
            `}} />
            {filters.map((f) => {
              // Determine if we should show this filter (only if items exist, except for "all")
              const count = items.filter((i) => i.category === f).length;
              if (f !== "all" && count === 0) return null;
              
              return (
                <button
                  key={f}
                  onClick={() => {
                    setActiveFilter(f);
                    setDisplayLimit(INITIAL_LIMIT);
                  }}
                  className={`shrink-0 whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 snap-start ${
                    activeFilter === f
                      ? "bg-zinc-950 text-white dark:bg-white dark:text-slate-900 shadow-md"
                      : "bg-white text-slate-700 dark:bg-gray-800/40 dark:text-gray-400 hover:bg-slate-50 hover:text-slate-900 dark:hover:text-white shadow-sm border border-slate-200 dark:border-gray-800"
                  }`}
                  aria-pressed={activeFilter === f}
                >
                  {CATEGORY_LABELS[f]}
                  {f !== "all" && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-xs opacity-80">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Grid Container */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-4 md:p-8">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 mt-2">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Belum ada foto</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
                  Foto-foto akan segera ditambahkan ke galeri.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.slice(0, displayLimit).map((item, index) => (
                    <GalleryCard
                    key={item.id}
                    item={item}
                    onView={() => setLightboxIndex(index)}
                  />
                  ))}
                </div>
                {displayLimit < filtered.length && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => setDisplayLimit((prev) => prev + 6)}
                      className="px-8 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-brand-600 dark:text-brand-400 font-semibold text-sm hover:bg-brand-50 dark:hover:bg-brand-500/10 hover:border-brand-200 dark:hover:border-brand-500/30 transition-all shadow-sm"
                    >
                      Muat Lebih Banyak
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      <div className="mt-16">
        <SponsorSection />
      </div>
    </div>
  );
}

// ─── GalleryCard ──────────────────────────────────────────────────────────────

function GalleryCard({
  item,
  onView,
}: {
  item: GalleryItem;
  onView: () => void;
}) {
  const category = item.category as GalleryCategory | null;
  const colorScheme = category ? CATEGORY_COLORS[category] : CATEGORY_COLORS.general;

  return (
    <div 
      className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 shadow-sm hover:shadow-xl hover:border-brand-500/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      onClick={onView}
    >
      <div className="relative w-full overflow-hidden bg-gray-100 dark:bg-gray-800" style={{ aspectRatio: "4/3" }}>
        <Image
          src={getImageUrl(item.image_url)}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-95 group-hover:scale-100">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
            <Maximize2 className="w-5 h-5 text-white drop-shadow-md" />
          </div>
        </div>

        {/* {category && (
          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide backdrop-blur-md border border-white/20 shadow-sm ${colorScheme.bg} ${colorScheme.text}`}>
            {CATEGORY_LABELS[category]}
          </div>
        )} */}
      </div>
    </div>
  );
}
