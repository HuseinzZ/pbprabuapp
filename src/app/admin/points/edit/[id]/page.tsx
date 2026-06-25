"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Point } from "@/app/admin/points/types";
import PointForm from "@/components/points/PointForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loader from "@/components/shared/Loader";

export default function EditPointPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [item, setItem] = useState<Point | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("points")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          router.replace("/admin/points");
        } else {
          setItem(data as Point);
        }
        setLoading(false);
      });
  }, [id]);

  if (!item && !loading) {
    return null;
  }

  // When loading, we might not have item yet, but we want to avoid showing a big loader.
  // Instead, render the form if item exists, or a skeleton/empty form if loading.
  if (loading) {
    return (
      <div className="animate-pulse">
        <PageBreadcrumb pageTitle="Edit Tipe Turnamen" paths={[{ name: "Tipe Turnamen", href: "/admin/points" }]} />
        <div className="h-[400px] bg-gray-100 dark:bg-gray-800 rounded-2xl mt-6"></div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Edit Pengaturan Poin" paths={[{ name: "Pengaturan Poin", href: "/admin/points" }]} />
      <PointForm mode="edit" initialData={item} />
    </div>
  );
}
