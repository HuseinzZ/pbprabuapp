"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TournamentType } from "@/app/admin/tournament-type/types";
import TournamentTypeForm from "@/components/tournament-type/TournamentTypeForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loader from "@/components/shared/Loader";

export default function EditTournamentTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [item, setItem] = useState<TournamentType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("tournament_types")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          router.replace("/admin/tournament-type");
        } else {
          setItem(data as TournamentType);
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
        <PageBreadcrumb pageTitle="Edit Tipe Turnamen" paths={[{ name: "Tipe Turnamen", href: "/admin/tournament-type" }]} />
        <div className="h-[400px] bg-gray-100 dark:bg-gray-800 rounded-2xl mt-6"></div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Edit Tipe Turnamen" paths={[{ name: "Tipe Turnamen", href: "/admin/tournament-type" }]} />
      <TournamentTypeForm mode="edit" initialData={item} />
    </div>
  );
}
