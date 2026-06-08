"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Player, FilterLevel } from "./types";
import TablePlayers from "@/components/players/TablePlayers";
import PlayerFilters from "@/components/players/PlayerFilters";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ExportButtons from "@/components/common/ExportButtons";
import Loader from "@/components/shared/Loader";
import { exportCSV, exportPDF } from "@/lib/utils/export";
import PrintReport, { PrintColumn } from "@/components/common/PrintReport";
import DeletePlayerModal from "@/components/players/DeletePlayerModal";
import { deleteStorageFile } from "@/lib/utils/storage";

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

  // Local state for search to debounce input
  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const { error } = await supabase.from("players").delete().eq("id", deleteTarget.id);
    if (error) {
      alert("Gagal menghapus pemain: " + error.message);
      setIsDeleting(false);
      return;
    }
    if (deleteTarget.avatar_url) {
      await deleteStorageFile(deleteTarget.avatar_url, "avatars");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
    fetchPlayers();
  }

  const handleSyncPoints = async () => {
    setSyncing(true);
    const { syncAllPlayerPoints } = await import("@/lib/actions/point");
    await syncAllPlayerPoints(supabase);
    await fetchPlayers();
    setSyncing(false);
  };
  const filtered = players.filter((p) =>
    p.full_name.toLowerCase().includes(urlSearch.toLowerCase()) ||
    (p.email ?? "").toLowerCase().includes(urlSearch.toLowerCase()) ||
    (p.nickname ?? "").toLowerCase().includes(urlSearch.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / urlPageSize));
  const paginatedPlayers = filtered.slice((urlPage - 1) * urlPageSize, urlPage * urlPageSize);
  const printColumns: PrintColumn[] = [
    { key: "no", label: "No", width: "5%" },
    { key: "name", label: "Nama", width: "25%" },
    { key: "nickname", label: "Nickname", width: "15%" },
    { key: "email", label: "Email", width: "15%" },
    { key: "level", label: "Level", width: "10%", align: "center" },
    { key: "points", label: "Poin", width: "10%", align: "center" },
    { key: "position", label: "Posisi", width: "10%", align: "center" },
    { key: "status", label: "Status", width: "10%", align: "center" },
  ];

  const printGroups = [
    {
      name: `Daftar Pemain (${filtered.length} Orang)`,
      rows: filtered.map((p, i) => ({
        no: i + 1,
        name: p.full_name,
        nickname: p.nickname || "-",
        email: p.email || "-",
        level: p.level || "-",
        points: p.ranking_points,
        position: p.ranking_position || "-",
        status: p.is_active ? "Aktif" : "Nonaktif",
      })),
    },
  ];

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
      <div className="flex items-end justify-end gap-3">
        <ExportButtons
          disabled={loading}
          onExportCSV={() =>
            exportCSV(
              "pemain.csv",
              ["No", "Nama", "Nickname", "Email", "Level", "Poin", "Posisi", "Status"],
              filtered.map((p, i) => [
                i + 1,
                p.full_name,
                p.nickname ?? "-",
                p.email ?? "-",
                p.level ?? "-",
                p.ranking_points,
                p.ranking_position ?? "-",
                p.is_active ? "Aktif" : "Nonaktif",
              ])
            )
          }
          onExportPDF={() => exportPDF("print-players", "Pemain.pdf")}
        />
      </div>
      <PlayerFilters
        filter={urlFilter}
        setFilter={(val) => updateQueryParams({ filter: val, page: "1" })}
        search={localSearch}
        setSearch={setLocalSearch}
        pageSize={urlPageSize}
        setPageSize={(val) => updateQueryParams({ size: val.toString(), page: "1" })}
        onSyncPoints={handleSyncPoints}
        syncing={syncing}
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
        onEditPlayer={(p) => router.push(`/admin/players/edit/${p.id}`)}
        onDeletePlayer={(p) => setDeleteTarget(p)}
      />

      <DeletePlayerModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        player={deleteTarget}
        isDeleting={isDeleting}
      />

      <PrintReport
        title="Daftar Pemain PB Prabu"
        subtitle={urlFilter !== "all" ? `Filter Level: ${urlFilter.toUpperCase()}` : "Semua Level"}
        columns={printColumns}
        groups={printGroups}
        printId="print-players"
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