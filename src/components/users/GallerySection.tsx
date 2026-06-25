"use client";
import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import Image from "next/image";

type GalleryItem = {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: string | null;
  created_at: string;
};

// Fallback placeholder items if Supabase gallery table is empty / doesn't exist
const PLACEHOLDER: GalleryItem[] = [
  { id: "p1", title: "Pertandingan Final", description: "Open Tournament Seri A 2025", image_url: "", category: "Turnamen", created_at: "" },
  { id: "p2", title: "Penyerahan Piala", description: "Prabu Cup 2025", image_url: "", category: "Turnamen", created_at: "" },
  { id: "p3", title: "Latihan Rutin", description: "Sesi latihan minggu ini", image_url: "", category: "Latihan", created_at: "" },
  { id: "p4", title: "Spin Wheel Live", description: "Undian Peserta", image_url: "", category: "Event", created_at: "" },
  { id: "p5", title: "Aksi Pemain", description: "Turnamen Ganda Campuran", image_url: "", category: "Turnamen", created_at: "" },
  { id: "p6", title: "Juara Baru", description: "Prabu Cup 2024", image_url: "", category: "Turnamen", created_at: "" },
];

const CATEGORY_EMOJIS: Record<string, string> = {
  Turnamen: "🏸", Latihan: "🎯", Event: "🌟", Default: "📸",
};

function PlaceholderCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const emoji = CATEGORY_EMOJIS[item.category || "Default"] || "📸";
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border border-[var(--hairline-soft)] bg-[var(--soft-cloud)] dark:bg-gray-800 w-full aspect-[4/3] flex flex-col items-center justify-center transition-all hover:border-[var(--hairline)] hover:scale-[1.01]"
      style={{ background: "linear-gradient(135deg, #1e1f28 0%, #14151e 100%)" }}
    >
      <span className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-500">{emoji}</span>
      <p className="text-white font-semibold font-ui text-sm text-center px-4">{item.title}</p>
      {item.description && <p className="text-white/50 font-ui text-xs mt-1 text-center px-4">{item.description}</p>}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors rounded-xl" />
    </button>
  );
}

export default function GallerySection() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);
  const [categories, setCategories] = useState<string[]>(["Semua"]);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const supabase = createClient();

  useEffect(() => {
    async function fetchGallery() {
      const { data, error } = await supabase
        .from("gallery")
        .select("id, title, description, image_url, category, created_at")
        .order("created_at", { ascending: false });

      if (error || !data || data.length === 0) {
        // Use placeholders gracefully
        setItems(PLACEHOLDER);
      } else {
        setItems(data);
        const cats = ["Semua", ...Array.from(new Set(data.map((d) => d.category || "Lainnya")))];
        setCategories(cats);
      }
      setLoading(false);
    }
    fetchGallery();
  }, [supabase]);

  const closeLightbox = useCallback(() => setLightbox(null), []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closeLightbox]);

  const filtered = activeCategory === "Semua"
    ? items
    : items.filter((i) => i.category === activeCategory);

  return (
    <section id="gallery" aria-label="Galeri" className="bg-[var(--soft-cloud)] dark:bg-gray-950 w-full py-[var(--sp-section)]">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8 xl:px-16">
        {/* Section header */}
        <div className="mb-10">
          <p className="text-[var(--mute)] text-xs font-ui font-semibold uppercase tracking-widest mb-2">
            Galeri
          </p>
          <h2 className="font-campaign text-4xl md:text-5xl text-[var(--ink)] dark:text-white mb-3">
            MOMEN BERHARGA
          </h2>
          <p className="text-[var(--mute)] font-ui text-sm max-w-md">
            Kumpulan foto dan dokumentasi kegiatan turnamen, latihan, dan momen spesial komunitas PB Prabu Bandung.
          </p>
        </div>

        {/* Category filter chips */}
        {categories.length > 1 && (
          <div className="flex items-center gap-2 flex-wrap mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`filter-chip ${activeCategory === cat ? "active" : ""}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`skeleton rounded-xl aspect-[4/3] ${i === 0 || i === 4 ? "col-span-2 md:col-span-2" : ""}`} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-[var(--mute)] font-ui">
            Tidak ada item galeri.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((item, idx) => {
              const isWide = idx === 0 || idx === filtered.length - 2;
              return (
                <div
                  key={item.id}
                  className={isWide ? "col-span-2 md:col-span-2" : ""}
                >
                  {item.image_url ? (
                    <button
                      onClick={() => setLightbox(item)}
                      className="group relative overflow-hidden rounded-xl w-full block"
                      style={{ aspectRatio: isWide ? "16/7" : "4/3" }}
                      aria-label={`Lihat foto: ${item.title}`}
                    >
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 33vw"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-end p-4">
                        <div className="translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <p className="text-white font-semibold font-ui text-sm">{item.title}</p>
                          {item.description && <p className="text-white/70 font-ui text-xs">{item.description}</p>}
                        </div>
                      </div>
                    </button>
                  ) : (
                    <PlaceholderCard item={item} onClick={() => setLightbox(item)} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox modal */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-[var(--ink)] rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeLightbox}
              aria-label="Tutup"
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {lightbox.image_url ? (
              <div className="relative w-full aspect-video">
                <Image
                  src={lightbox.image_url}
                  alt={lightbox.title}
                  fill
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-full aspect-video flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1e1f28 0%, #14151e 100%)" }}>
                <span className="text-8xl">{CATEGORY_EMOJIS[lightbox.category || "Default"] || "📸"}</span>
              </div>
            )}

            <div className="p-6">
              <h3 className="font-campaign text-2xl text-white mb-1">{lightbox.title.toUpperCase()}</h3>
              {lightbox.description && <p className="text-white/60 font-ui text-sm">{lightbox.description}</p>}
              {lightbox.category && (
                <span className="mt-3 inline-block px-3 py-1 bg-white/10 text-white/70 text-xs font-ui rounded-full">
                  {lightbox.category}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
