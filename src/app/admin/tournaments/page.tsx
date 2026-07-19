"use client";
import React, { useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tournament, FilterStatus, STATUS_CONFIG } from "./types";
import TournamentTable from "@/components/tournaments/TournamentTable";
import TournamentFilters from "@/components/tournaments/TournamentFilters";
import SummaryStats from "@/components/tournaments/SummaryStats";
import ActivityLogs from "@/components/users/ActivityLogs";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ExportButtons from "@/components/common/ExportButtons";
import Loader from "@/components/shared/Loader";
import { exportCSV, exportPDF, exportJSON } from "@/lib/utils/export";
import PrintReport, { PrintColumn } from "@/components/common/PrintReport";
import DeleteTournamentModal from "@/components/tournaments/DeleteTournamentModal";
import { ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";

function TournamentsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const urlFilter = (searchParams.get("status") as FilterStatus) || "all";
  const urlSearch = searchParams.get("search") || "";
  const urlPageSize = Number(searchParams.get("size")) || 10;
  const urlPage = Number(searchParams.get("page")) || 1;
  const urlDate = searchParams.get("date") || "";
  const urlSortBy = searchParams.get("sort") || "date_desc";

  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Tournament | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const storedLogs = localStorage.getItem('manajemen_turnamen_logs');
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch (err) {
        setLogs([]);
      }
    }
  }, []);

  const addLog = useCallback((actionText: string, type: string) => {
    const newLog = {
      id: `log-${Date.now()}`,
      action: actionText,
      timestamp: new Date().toISOString(),
      type
    };
    setLogs((prev) => {
      const updatedLogs = [...prev, newLog].slice(-50);
      localStorage.setItem('manajemen_turnamen_logs', JSON.stringify(updatedLogs));
      return updatedLogs;
    });
  }, []);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('manajemen_turnamen_logs');
    toast.success("Log aktivitas sesi berhasil dibersihkan!");
  }, []);

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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localSearch !== urlSearch) {
        updateQueryParams({ search: localSearch, page: "1" });
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [localSearch, urlSearch, updateQueryParams]);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    const { syncTournamentStatuses } = await import("@/lib/utils/tournamentStatus");
    await syncTournamentStatuses();

    const query = supabase
      .from("tournaments")
      .select("*, points(name)")
      .order("start_date", { ascending: false });

    const { data } = await query;
    setTournaments((data as Tournament[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await supabase.from("tournaments").delete().eq("id", deleteTarget.id);
    addLog(`Sistem menghapus turnamen "${deleteTarget.name}"`, 'delete');
    toast.success("Berhasil menghapus turnamen!");
    setIsDeleting(false);
    setDeleteTarget(null);
    fetchTournaments();
  }

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  const filteredTournaments = useMemo(() => {
    let list = [...tournaments];

    const q = urlSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        (t.location ?? "").toLowerCase().includes(q) ||
        (t.points?.name ?? "").toLowerCase().includes(q)
      );
    }

    if (urlFilter !== 'all') {
      list = list.filter(t => t.status === urlFilter);
    }

    if (urlDate) {
      list = list.filter(t => t.start_date && t.start_date.startsWith(urlDate));
    }

    list.sort((a, b) => {
      switch (urlSortBy) {
        case "date_desc": return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        case "date_asc": return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        case "name_asc": return a.name.localeCompare(b.name);
        case "name_desc": return b.name.localeCompare(a.name);
        case "prize_desc": return (b.prize_pool || 0) - (a.prize_pool || 0);
        default: return 0;
      }
    });

    return list;
  }, [tournaments, urlSearch, urlFilter, urlDate, urlSortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredTournaments.length / urlPageSize));
  const paginatedTournaments = filteredTournaments.slice((urlPage - 1) * urlPageSize, urlPage * urlPageSize);

  const printColumns: PrintColumn[] = [
    { key: "no", label: "No", width: "5%" },
    { key: "name", label: "Nama Turnamen", width: "25%" },
    { key: "type", label: "Kategori", width: "15%" },
    { key: "status", label: "Status", width: "10%", align: "center" },
    { key: "location", label: "Lokasi", width: "20%" },
    { key: "startDate", label: "Mulai", width: "15%" },
    { key: "prize", label: "Hadiah", width: "10%", align: "right" }
  ];

  const printGroups = [
    {
      name: `Daftar Turnamen (${filteredTournaments.length} Turnamen)`,
      rows: filteredTournaments.map((t, i) => ({
        no: i + 1,
        name: t.name,
        type: t.points?.name ?? "-",
        status: t.status,
        location: t.location ?? "-",
        startDate: new Date(t.start_date).toLocaleDateString("id-ID"),
        prize: t.prize_pool ? formatRupiah(t.prize_pool) : "-",
      })),
    }
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
      <div className="flex flex-col gap-4">
        <PageBreadcrumb pageTitle="Turnamen" />
        <div className="flex items-center justify-end">
          <ExportButtons
            disabled={loading || tournaments.length === 0}
            onExportCSV={() => exportCSV(
              "turnamen.csv",
              ["No", "Nama", "Tipe", "Status", "Lokasi", "Tanggal Mulai", "Peserta Maks", "Hadiah"],
              filteredTournaments.map((t, i) => [
                i + 1, t.name, t.points?.name ?? "-", t.status, t.location ?? "-",
                new Date(t.start_date).toLocaleDateString("id-ID"),
                t.max_participants ?? "-", t.prize_pool ?? 0,
              ])
            )}
            onExportJSON={() => exportJSON(
              "turnamen.json",
              filteredTournaments.map((t, i) => ({
                no: i + 1,
                name: t.name,
                type: t.points?.name ?? "-",
                status: t.status,
                location: t.location ?? "-",
                startDate: new Date(t.start_date).toLocaleDateString("id-ID"),
                maxParticipants: t.max_participants ?? "-",
                prize: t.prize_pool ?? 0,
              }))
            )}
            onExportPDF={() => exportPDF("print-tournaments", "Turnamen.pdf")}
          />
        </div>
      </div>

      {/* Aggregate Bento Metrics */}
      <SummaryStats tournaments={tournaments} />

      {/* Dashboard Grid System */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* Main List Section (Wide Column) */}
        <section className="lg:col-span-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm flex flex-col">
          <TournamentFilters
            search={localSearch}
            setSearch={setLocalSearch}
            status={urlFilter}
            setStatus={(val) => updateQueryParams({ status: val, page: "1" })}
            sortBy={urlSortBy}
            setSortBy={(val) => updateQueryParams({ sort: val, page: "1" })}
            tournamentDate={urlDate}
            setTournamentDate={(val) => updateQueryParams({ date: val, page: "1" })}
            pageSize={urlPageSize}
            setPageSize={(val) => updateQueryParams({ size: val.toString(), page: "1" })}
          />
          {/* We wrap Table to hide its internal borders/rounded corners to blend with the section */}
          <div className="[&>div]:border-0 [&>div]:shadow-none [&>div]:rounded-none">
            <TournamentTable
              loading={loading}
              tournaments={paginatedTournaments}
              filter={urlFilter}
              currentPage={urlPage}
              pageSize={urlPageSize}
              totalPages={totalPages}
              totalItems={filteredTournaments.length}
              onPageChange={(page) => updateQueryParams({ page: page.toString() })}
              onEdit={(t) => router.push(`/admin/tournaments/edit/${t.id}`)}
              onDelete={(t) => setDeleteTarget(t)}
            />
          </div>
        </section>

        {/* Quick Info (Slim Column) */}
        <section className="space-y-6 lg:sticky lg:top-6">
          <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm space-y-4">
            <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-brand-500" />
              Keamanan & Sinkronisasi
            </h4>
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
              Manajemen status turnamen, registrasi, dan kontrol turnamen diatur pada halaman ini. Status diperbarui secara otomatis berdasarkan tanggal.
            </p>
          </div>

          <ActivityLogs logs={logs} onClear={handleClearLogs} />
        </section>

      </div>

      <DeleteTournamentModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        tournament={deleteTarget}
        isDeleting={isDeleting}
      />

      <PrintReport
        title="Daftar Turnamen PB Prabu"
        subtitle={urlFilter !== "all" ? `Filter Status: ${STATUS_CONFIG[urlFilter as Exclude<FilterStatus, "all">]?.label.toUpperCase()}` : "Semua Status"}
        columns={printColumns}
        groups={printGroups}
        printId="print-tournaments"
      />
    </div>
  );
}

export default function TournamentsPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader /></div>}>
      <TournamentsPageContent />
    </Suspense>
  );
}