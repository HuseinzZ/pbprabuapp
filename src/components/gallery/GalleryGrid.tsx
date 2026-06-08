"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Plus, Edit2, Image as ImageIcon, Filter,
  X, ChevronLeft, ChevronRight, Maximize2, Loader2,
  Play, Pause, ZoomIn, ZoomOut, RotateCcw,
  Maximize, Minimize, LayoutGrid
} from "lucide-react";
import { GalleryItem, GalleryCategory, CATEGORY_LABELS, CATEGORY_COLORS } from "@/app/admin/gallery/types";
import Loader from "@/components/shared/Loader";

interface GalleryGridProps {
  items: GalleryItem[];
}

type FilterType = "all" | GalleryCategory;

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

const PLAY_INTERVAL = 3000; // ms per slide

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
  const prevIndex = (index - 1 + items.length) % items.length;
  const nextIndex = (index + 1) % items.length;

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

  // Set mounted
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Slideshow play/pause
  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(next, PLAY_INTERVAL);
    } else {
      if (playRef.current) clearInterval(playRef.current);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [playing, next]);

  // Keyboard
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

  // Fullscreen event listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Prevent body scroll
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

  // Drag Handlers
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
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex flex-col select-none justify-between"
    >

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-sm z-20">
        {/* Left: navigation counter */}
        <div className="flex items-center gap-1">
          <button
            onClick={prev}
            disabled={items.length <= 1}
            className="w-8 h-8 flex items-center justify-center rounded !text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5 !text-white" color="#ffffff" />
          </button>
          <span className="!text-white text-sm font-medium tabular-nums px-1" style={{ color: "#ffffff" }}>
            {index + 1} / {items.length}
          </span>
          <button
            onClick={next}
            disabled={items.length <= 1}
            className="w-8 h-8 flex items-center justify-center rounded !text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5 !text-white" color="#ffffff" />
          </button>
        </div>

        {/* Right: action icons */}
        <div className="flex items-center gap-1">
          {/* Zoom out */}
          <button
            onClick={zoomOut}
            disabled={zoom <= 1}
            title="Zoom out"
            className="w-8 h-8 flex items-center justify-center rounded !text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <ZoomOut className="w-4 h-4 !text-white" color="#ffffff" />
          </button>
          {/* Zoom reset */}
          {zoom !== 1 && (
            <button
              onClick={zoomReset}
              title="Reset zoom"
              className="px-2 h-8 flex items-center justify-center rounded !text-white hover:bg-white/10 transition-colors text-xs font-mono"
              style={{ color: "#ffffff" }}
            >
              {Math.round(zoom * 100)}%
            </button>
          )}
          {/* Zoom in */}
          <button
            onClick={zoomIn}
            disabled={zoom >= 4}
            title="Zoom in"
            className="w-8 h-8 flex items-center justify-center rounded !text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <ZoomIn className="w-4 h-4 !text-white" color="#ffffff" />
          </button>

          <div className="w-px h-5 bg-white/20 mx-1" />

          {/* Play/Pause slideshow */}
          <button
            onClick={() => setPlaying((p) => !p)}
            disabled={items.length <= 1}
            title={playing ? "Pause slideshow" : "Play slideshow"}
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors disabled:opacity-30 ${
              playing
                ? "!text-white bg-white/20 hover:bg-white/30"
                : "!text-white hover:bg-white/10"
            }`}
          >
            {playing ? (
              <Pause className="w-4 h-4 !text-white" color="#ffffff" />
            ) : (
              <Play className="w-4 h-4 !text-white" color="#ffffff" />
            )}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            className="w-8 h-8 flex items-center justify-center rounded !text-white hover:bg-white/10 transition-colors"
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 !text-white" color="#ffffff" />
            ) : (
              <Maximize className="w-4 h-4 !text-white" color="#ffffff" />
            )}
          </button>

          {/* Thumbnail Toggle */}
          <button
            onClick={() => setShowThumbnails((t) => !t)}
            disabled={items.length <= 1}
            title="Thumbnails"
            className={`w-8 h-8 flex items-center justify-center rounded transition-colors disabled:opacity-30 ${
              showThumbnails
                ? "!text-white bg-white/20 hover:bg-white/30"
                : "!text-white hover:bg-white/10"
            }`}
          >
            <LayoutGrid className="w-4 h-4 !text-white" color="#ffffff" />
          </button>

          <div className="w-px h-5 bg-white/20 mx-1" />

          {/* Close */}
          <button
            onClick={onClose}
            title="Tutup (Esc)"
            className="w-8 h-8 flex items-center justify-center rounded !text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 !text-white" color="#ffffff" />
          </button>
        </div>
      </div>

      {/* ── Main image area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center relative overflow-hidden z-10">
        {/* Prev (left) */}
        {items.length > 1 && (
          <div
            className="absolute left-0 top-0 bottom-0 w-16 md:w-28 z-20 cursor-pointer flex items-center justify-center group"
            onClick={prev}
          >
            <div className="flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-md transition-all text-white">
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 drop-shadow-md" />
            </div>
          </div>
        )}

        {/* Main photo */}
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
            className="relative flex items-center justify-center max-w-full max-h-full"
            style={{ 
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.2s ease-out" 
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={item.id}
              src={getImageUrl(item.image_url)}
              alt={item.title}
              className="object-contain shadow-2xl rounded-sm max-w-full max-h-full"
              style={{ display: "block", userSelect: "none" }}
              draggable={false}
            />
          </div>
        </div>

        {/* Next (right) */}
        {items.length > 1 && (
          <div
            className="absolute right-0 top-0 bottom-0 w-16 md:w-28 z-20 cursor-pointer flex items-center justify-center group"
            onClick={next}
          >
            <div className="flex items-center justify-center w-10 h-10 md:w-14 md:h-14 rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-md transition-all text-white">
              <ChevronRight className="w-6 h-6 md:w-8 md:h-8 drop-shadow-md" />
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom bar (Thumbnails / Progress) ─────────────────────────────── */}
      <div className="flex-shrink-0 z-20 bg-black/60 backdrop-blur-sm">
        {/* Thumbnail strip */}
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
                  <Image
                    src={getImageUrl(it.image_url)}
                    alt={it.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Progress bar (play mode) */}
        {playing && (
          <div className="h-1 bg-white/10 w-full">
            <div
              key={index}
              className="h-full bg-brand-500"
              style={{ animation: `slideProgress ${PLAY_INTERVAL}ms linear forwards` }}
            />
          </div>
        )}
      </div>

      {/* Inject CSS for slideshow progress animation */}
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

// ─── GalleryGrid ───────────────────────────────────────────────────────────────

export default function GalleryGrid({ items }: GalleryGridProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [navigatingAdd, setNavigatingAdd] = useState(false);

  const filtered = activeFilter === "all"
    ? items
    : items.filter((item) => item.category === activeFilter);

  const filters: FilterType[] = ["all", "tournament", "training", "event", "general"];

  return (
    <div className="space-y-6">
      {/* Navigation loader
      {navigatingAdd && (
        <div className="absolute inset-0 z-[0] flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
          <Loader />
        </div>
      )} */}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          items={filtered}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* ─── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-2 overflow-x-auto shrink-0 w-full sm:w-auto">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-1 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeFilter === f
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
            >
              {CATEGORY_LABELS[f]}
              {f !== "all" && (
                <span className="ml-1 opacity-70 font-normal">
                  ({items.filter((i) => i.category === f).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Add Button */}
        <div className="flex shrink-0 w-full sm:w-auto">
          <button
            onClick={() => { setNavigatingAdd(true); router.push("/admin/gallery/add"); }}
            disabled={navigatingAdd}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors shadow-sm whitespace-nowrap disabled:opacity-70"
          >
            {navigatingAdd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Tambah Foto
          </button>
        </div>
      </div>

      {/* ─── Grid Container ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
        {/* ─── Stats ───────────────────────────────────────────────────────────── */}
        {/* <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Menampilkan <span className="font-semibold text-gray-700 dark:text-gray-300">{filtered.length}</span> dari {items.length} foto
          </p>
        </div> */}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 mt-2">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-700 dark:text-gray-300 mb-1">Belum ada foto</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
              {activeFilter === "all"
                ? "Mulai tambahkan foto pertama Anda."
                : `Belum ada foto kategori "${CATEGORY_LABELS[activeFilter]}".`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((item, index) => (
              <GalleryCard
                key={item.id}
                item={item}
                onView={() => setLightboxIndex(index)}
                onEdit={() => router.push(`/admin/gallery/edit/${item.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── GalleryCard ──────────────────────────────────────────────────────────────

function GalleryCard({
  item,
  onView,
  onEdit,
}: {
  item: GalleryItem;
  onView: () => void;
  onEdit: () => void;
}) {
  const category = item.category as GalleryCategory | null;
  const colorScheme = category ? CATEGORY_COLORS[category] : CATEGORY_COLORS.general;

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    onEdit();
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">

      {/* Image — click to open lightbox */}
      <div
        className="relative w-full overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-zoom-in border-b border-gray-200 dark:border-gray-800"
        style={{ aspectRatio: "4/3" }}
        onClick={onView}
      >
        <Image
          src={getImageUrl(item.image_url)}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Maximize2 className="w-5 h-5 text-white" />
          </div>
        </div>
        {!item.is_published && (
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-semibold tracking-wide">
            Draft
          </div>
        )}
        {/* {category && (
          <div className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide backdrop-blur-sm ${colorScheme.bg} ${colorScheme.text}`}>
            {CATEGORY_LABELS[category]}
          </div>
        )} */}
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-1 mb-1">
          {item.title}
        </h3>
        {item.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2">
            {item.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {item.taken_at
              ? new Date(item.taken_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
              : new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-brand-500 hover:text-white text-gray-600 dark:text-gray-400 text-xs font-medium transition-colors"
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
