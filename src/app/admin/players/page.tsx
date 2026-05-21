"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Player, FilterLevel } from "./types";

import TablePlayers from "@/components/players/TablePlayers";
import LinkModal from "@/components/players/LinkModal";
import PlayerFilters from "@/components/players/PlayerFilters";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loader from "@/components/shared/Loader";

// ─── Content Component ────────────────────────────────────────────────────────

function PlayersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Parse URL Parameters
  const urlFilter = (searchParams.get("filter") as FilterLevel) || "all";
  const urlSearch = searchParams.get("search") || "";
  const urlPageSize = Number(searchParams.get("size")) || 10;
  const urlPage = Number(searchParams.get("page")) || 1;
  const action = searchParams.get("action");
  const actionId = searchParams.get("id");

  // Local state for search to debounce input
  const [localSearch, setLocalSearch] = useState(urlSearch);

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper to update URL
  const updateQueryParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || (key === "page" && value === "1")) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`${pathname}?${params.toString()}`);
  }, [pathname, router, searchParams]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearch !== urlSearch) {
        updateQueryParams({ search: localSearch, page: "1" });
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [localSearch, urlSearch, updateQueryParams]);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("players")
      .select("id, profile_id, full_name, nickname, email, phone, gender, level, ranking_points, ranking_position, is_active, joined_at, height, hand_dominance, avatar_url, address")
      .order("ranking_points", { ascending: false });

    if (urlFilter !== "all") {
      query = query.eq("level", urlFilter);
    }

    const { data } = await query;
    setPlayers((data as Player[]) ?? []);
    setLoading(false);
  }, [urlFilter, supabase]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Find selected player for link modal
  const selectedPlayer = players.find((p) => p.id === actionId) || null;

  const closeModal = () => {
    updateQueryParams({ action: null, id: null });
  };

  const filtered = players.filter((p) =>
    p.full_name.toLowerCase().includes(urlSearch.toLowerCase()) ||
    (p.email ?? "").toLowerCase().includes(urlSearch.toLowerCase()) ||
    (p.nickname ?? "").toLowerCase().includes(urlSearch.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / urlPageSize));
  const paginatedPlayers = filtered.slice((urlPage - 1) * urlPageSize, urlPage * urlPageSize);

  if (loading && players.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Manajemen Pemain" />

      <PlayerFilters
        filter={urlFilter}
        setFilter={(val) => updateQueryParams({ filter: val, page: "1" })}
        search={localSearch}
        setSearch={setLocalSearch}
        pageSize={urlPageSize}
        setPageSize={(val) => updateQueryParams({ size: val.toString(), page: "1" })}
      />

      <TablePlayers
        loading={loading}
        players={paginatedPlayers}
        filter={urlFilter}
        currentPage={urlPage}
        pageSize={urlPageSize}
        totalPages={totalPages}
        totalPlayers={filtered.length}
        onPageChange={(page) => updateQueryParams({ page: page.toString() })}
        onLinkAccount={(p) => updateQueryParams({ action: "link", id: p.id })}
        onEditPlayer={(p) => router.push(`/admin/players/edit/${p.id}`)}
        onDeletePlayer={(p) => router.push(`/admin/players/delete/${p.id}`)}
      />

      {/* Link modal */}
      <LinkModal
        isOpen={action === "link"}
        onClose={closeModal}
        player={selectedPlayer}
        onSaved={fetchPlayers}
      />
    </div>
  );
}

// ─── Main Page with Suspense Boundary ─────────────────────────────────────────

export default function PlayersPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader /></div>}>
      <PlayersPageContent />
    </Suspense>
  );
}
