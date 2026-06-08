"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tournament, FilterStatus } from "./types";
import TournamentTable from "@/components/tournaments/TournamentTable";
import TournamentFilters from "@/components/tournaments/TournamentFilters";
import DeleteTournamentModal from "@/components/tournaments/DeleteTournamentModal";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ExportButtons from "@/components/common/ExportButtons";
import Loader from "@/components/shared/Loader";
import { exportCSV, exportPDF } from "@/lib/utils/export";
import PrintReport, { PrintColumn } from "@/components/common/PrintReport";
// ─── Content ──────────────────────────────────────────────────────────────────
function TournamentsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();
  // URL state
  const urlSearch = searchParams.get("search") || "";
  const urlStatus = (searchParams.get("status") as FilterStatus) || "all";
  const urlTournamentDate = searchParams.get("date") || "";
  const urlPageSize = Number(searchParams.get("size")) || 10;
  const urlPage = Number(searchParams.get("page")) || 1;
  const action = searchParams.get("action");
  const actionId = searchParams.get("id");
  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  // ─── URL helpers ──────────────────────────────────────────────────────────
  const updateQueryParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || (key === "page" && value === "1")) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );
  // ─── Debounce search ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      if (localSearch !== urlSearch) {
        updateQueryParams({ search: localSearch, page: "1" });
      }
    }, 500);
    return () => clearTimeout(t);
  }, [localSearch, urlSearch, updateQueryParams]);
  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    
    // Sync statuses before fetching
    const { syncTournamentStatuses } = await import("@/lib/utils/tournamentStatus");
    await syncTournamentStatuses();
    let query = supabase
      .from("tournaments")
      .select("*, tournament_types(name)")
      .order("start_date", { ascending: false });
    if (urlStatus !== "all") query = query.eq("status", urlStatus);
    if (urlTournamentDate) {
      const [year, month, day] = urlTournamentDate.split("-");
      if (year && month && day) {
        const startDate = new Date(Number(year), Number(month) - 1, Number(day));
        const endDate = new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);
        query = query.gte("start_date", startDate.toISOString()).lte("start_date", endDate.toISOString());
      }
    }
    const { data } = await query;
    setTournaments((data as Tournament[]) ?? []);
    setLoading(false);
  }, [urlStatus, urlTournamentDate, supabase]);
  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);
  // ─── Derived ──────────────────────────────────────────────────────────────
  const filtered = tournaments.filter(
    (t) =>
      t.name.toLowerCase().includes(urlSearch.toLowerCase()) ||
      (t.location ?? "").toLowerCase().includes(urlSearch.toLowerCase()) ||
      (t.tournament_types?.name ?? "").toLowerCase().includes(urlSearch.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / urlPageSize));
  const paginated = filtered.slice(
    (urlPage - 1) * urlPageSize,
    urlPage * urlPageSize
  );
  const selectedTournament = tournaments.find((t) => t.id === actionId) || null;
  // ─── Handlers ─────────────────────────────────────────────────────────────
  const closeModal = () => updateQueryParams({ action: null, id: null });
  const handleDelete = async () => {
    if (!selectedTournament) return;
    setIsDeleting(true);
    await supabase.from("tournaments").delete().eq("id", selectedTournament.id);
    setIsDeleting(false);
    closeModal();
    fetchTournaments();
  };
  // ─── Render ───────────────────────────────────────────────────────────────
  const printColumns: PrintColumn[] = [
    { key: "no", label: "No", width: "5%" },
    { key: "name", label: "Nama", width: "20%" },
    { key: "type", label: "Tipe", width: "15%" },
    { key: "status", label: "Status", width: "10%", align: "center" },
    { key: "location", label: "Lokasi", width: "15%" },
    { key: "startDate", label: "Mulai", width: "10%" },
    { key: "endDate", label: "Selesai", width: "10%" },
    { key: "maxParticipants", label: "Max", width: "5%", align: "center" },
    { key: "prize", label: "Hadiah", width: "10%", align: "right" },
  ];

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  const printGroups = [
    {
      name: `Daftar Turnamen (${filtered.length} Turnamen)`,
      rows: filtered.map((t, i) => ({
        no: i + 1,
        name: t.name,
        type: t.tournament_types?.name ?? "-",
        status: t.status,
        location: t.location ?? "-",
        startDate: new Date(t.start_date).toLocaleDateString("id-ID"),
        endDate: new Date(t.end_date).toLocaleDateString("id-ID"),
        maxParticipants: t.max_participants ?? "-",
        prize: t.prize_pool ? formatRupiah(t.prize_pool) : "-",
      })),
    },
  ];

  if (loading && tournaments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Manajemen Turnamen" />
      <div className="flex items-start justify-end gap-3">
        <ExportButtons
          disabled={loading}
          onExportCSV={() =>
            exportCSV(
              "turnamen.csv",
              ["No", "Nama", "Tipe", "Status", "Lokasi", "Tanggal Mulai", "Tanggal Selesai", "Peserta Maks", "Hadiah"],
              filtered.map((t, i) => [
                i + 1,
                t.name,
                t.tournament_types?.name ?? "-",
                t.status,
                t.location ?? "-",
                new Date(t.start_date).toLocaleDateString("id-ID"),
                new Date(t.end_date).toLocaleDateString("id-ID"),
                t.max_participants ?? "-",
                t.prize_pool ?? 0,
              ])
            )
          }
          onExportPDF={() => exportPDF("print-tournaments", "Turnamen.pdf")}
        />
      </div>
      <TournamentFilters
        search={localSearch}
        setSearch={setLocalSearch}
        status={urlStatus}
        setStatus={(val) => updateQueryParams({ status: val, page: "1" })}
        tournamentDate={urlTournamentDate}
        setTournamentDate={(val) => updateQueryParams({ date: val, page: "1" })}
        pageSize={urlPageSize}
        setPageSize={(val) =>
          updateQueryParams({ size: val.toString(), page: "1" })
        }
      />
      <TournamentTable
        loading={loading}
        tournaments={paginated}
        currentPage={urlPage}
        pageSize={urlPageSize}
        totalPages={totalPages}
        totalItems={filtered.length}
        filter={urlStatus}
        onPageChange={(page) => updateQueryParams({ page: page.toString() })}
        onEdit={(t) => router.push(`/admin/tournaments/edit/${t.id}`)}
        onDelete={(t) => updateQueryParams({ action: "delete", id: t.id })}
      />

      <PrintReport
        title="Daftar Turnamen PB Prabu"
        subtitle={urlStatus !== "all" ? `Filter Status: ${urlStatus.toUpperCase()}` : "Semua Status"}
        columns={printColumns}
        groups={printGroups}
        printId="print-tournaments"
      />
      <DeleteTournamentModal
        isOpen={action === "delete"}
        onClose={closeModal}
        onConfirm={handleDelete}
        tournament={selectedTournament}
        isDeleting={isDeleting}
      />
    </div>
  );
}
// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TournamentsPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader /></div>}>
      <TournamentsPageContent />
    </Suspense>
  );
}