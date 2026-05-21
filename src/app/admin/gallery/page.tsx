"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import GalleryGrid from "@/components/gallery/GalleryGrid";
import { GalleryItem } from "@/app/admin/gallery/types";
import Loader from "@/components/shared/Loader";

// ─── Content Component ────────────────────────────────────────────────────────

function GalleryPageContent() {
  const supabase = createClient();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGallery = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("gallery")
      .select("id, title, description, image_url, category, taken_at, is_published, uploaded_by, created_at, updated_at")
      .order("created_at", { ascending: false });
    setItems((data as GalleryItem[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Galeri Foto" />
      <GalleryGrid items={items} />
    </div>
  );
}

// ─── Main Page with Suspense Boundary ─────────────────────────────────────────

export default function GalleryPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader /></div>}>
      <GalleryPageContent />
    </Suspense>
  );
}
