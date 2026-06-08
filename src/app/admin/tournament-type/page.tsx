"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TournamentType } from "./types";
import { StatusFilter } from "@/components/tournament-type/TournamentTypeFilters";

import TournamentTypeTable from "@/components/tournament-type/TournamentTypeTable";
import TournamentTypeFilters from "@/components/tournament-type/TournamentTypeFilters";
import DeleteTournamentTypeModal from "@/components/tournament-type/DeleteTournamentTypeModal";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loader from "@/components/shared/Loader";

// ─── Content ──────────────────────────────────────────────────────────────────

function TournamentTypeContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const urlSearch = searchParams.get("search") || "";
  const urlStatus = (searchParams.get("status") as StatusFilter) || "all";
  const urlPageSize = Number(searchParams.get("size")) || 10;
  const urlPage = Number(searchParams.get("page")) || 1;

  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [items, setItems] = useState<TournamentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<TournamentType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (!v || (k === "page" && v === "1")) params.delete(k);
      else params.set(k, v);
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== urlSearch) updateParams({ search: localSearch, page: "1" });
    }, 400);
    return () => clearTimeout(t);
  }, [localSearch, urlSearch, updateParams]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("tournament_types")
      .select("*")
      .order("created_at", { ascending: false });

    if (urlStatus === "active") query = query.eq("is_active", true);
    if (urlStatus === "inactive") query = query.eq("is_active", false);

    const { data } = await query;
    setItems((data as TournamentType[]) ?? []);
    setLoading(false);
  }, [urlStatus, supabase]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await supabase.from("tournament_types").delete().eq("id", deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);
    fetchItems();
  }

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(urlSearch.toLowerCase()) ||
    (i.description ?? "").toLowerCase().includes(urlSearch.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / urlPageSize));
  const paginated = filtered.slice((urlPage - 1) * urlPageSize, urlPage * urlPageSize);

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Tipe Turnamen" />

      <TournamentTypeFilters
        search={localSearch}
        setSearch={setLocalSearch}
        status={urlStatus}
        setStatus={(v) => updateParams({ status: v, page: "1" })}
        pageSize={urlPageSize}
        setPageSize={(v) => updateParams({ size: v.toString(), page: "1" })}
      />

      <TournamentTypeTable
        loading={loading}
        items={paginated}
        currentPage={urlPage}
        pageSize={urlPageSize}
        totalPages={totalPages}
        totalItems={filtered.length}
        onPageChange={(p) => updateParams({ page: p.toString() })}
        onEdit={(item) => router.push(`/admin/tournament-type/edit/${item.id}`)}
        onDelete={(item) => setDeleteTarget(item)}
      />

      <DeleteTournamentTypeModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        item={deleteTarget}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default function TournamentTypePage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader /></div>}>
      <TournamentTypeContent />
    </Suspense>
  );
}
