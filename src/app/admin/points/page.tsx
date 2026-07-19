"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Point } from "./types";
import { StatusFilter } from "@/components/points/PointFilters";

import PointTable from "@/components/points/PointTable";
import PointFilters from "@/components/points/PointFilters";
import DeletePointModal from "@/components/points/DeletePointModal";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ExportButtons from "@/components/common/ExportButtons";
import { exportCSV, exportJSON, exportPDF } from "@/lib/utils/export";
import Loader from "@/components/shared/Loader";
import ActivityLogs from "@/components/users/ActivityLogs";
import SummaryStats from "@/components/points/SummaryStats";
import { ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";

// ─── Content ──────────────────────────────────────────────────────────────────

function PointContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const urlSearch = searchParams.get("search") || "";
  const urlStatus = (searchParams.get("status") as StatusFilter) || "all";
  const urlPageSize = Number(searchParams.get("size")) || 10;
  const urlPage = Number(searchParams.get("page")) || 1;

  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [items, setItems] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Point | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const storedLogs = localStorage.getItem('manajemen_poin_logs');
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
      const updatedLogs = [...prev, newLog].slice(-50); // Keep last 50
      localStorage.setItem('manajemen_poin_logs', JSON.stringify(updatedLogs));
      return updatedLogs;
    });
  }, []);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('manajemen_poin_logs');
    toast.success("Log aktivitas sesi berhasil dibersihkan!");
  }, []);

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
      .from("points")
      .select("*")
      .order("created_at", { ascending: false });

    if (urlStatus === "active") query = query.eq("is_active", true);
    if (urlStatus === "inactive") query = query.eq("is_active", false);

    const { data } = await query;
    setItems((data as Point[]) ?? []);
    setLoading(false);
  }, [urlStatus, supabase]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await supabase.from("points").delete().eq("id", deleteTarget.id);
    addLog(`Sistem menghapus tipe turnamen ${deleteTarget.name}`, 'delete');
    toast.success("Berhasil menghapus tipe turnamen!");
    setIsDeleting(false);
    setDeleteTarget(null);
    fetchItems();
  }

  const handleToggleStatus = async (item: Point) => {
    const newStatus = !item.is_active;
    setItems((prev) => prev.map((u) => u.id === item.id ? { ...u, is_active: newStatus } : u));

    const { error } = await supabase.from("points").update({ is_active: newStatus }).eq("id", item.id);
    if (error) {
      setItems((prev) => prev.map((u) => u.id === item.id ? { ...u, is_active: !newStatus } : u));
      toast.error("Gagal mengubah status: " + error.message);
    } else {
      toast.success(`Status ${item.name} berhasil diubah!`);
      addLog(`Status ${item.name} diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}`, 'status_toggle');
    }
  };

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
      <div className="flex flex-col gap-4">
        <PageBreadcrumb pageTitle="Pengaturan Poin" />
        <div className="flex items-center justify-end">
          <ExportButtons
            disabled={loading || items.length === 0}
            onExportCSV={() => exportCSV(
              "poin.csv",
              ["No", "Nama Tipe", "Juara 1", "Juara 2", "Semifinal", "Quarterfinal", "Status"],
              filtered.map((t, i) => [
                i + 1, t.name, t.points_winner, t.points_finalist, t.points_semifinalist, t.points_quarterfinalist, t.is_active ? "Aktif" : "Nonaktif"
              ])
            )}
            onExportJSON={() => exportJSON(
              "poin.json",
              filtered.map((t, i) => ({
                no: i + 1,
                name: t.name,
                winner: t.points_winner,
                finalist: t.points_finalist,
                semifinalist: t.points_semifinalist,
                quarterfinalist: t.points_quarterfinalist,
                status: t.is_active ? "Aktif" : "Nonaktif"
              }))
            )}
            onExportPDF={() => exportPDF("print-points", "Poin.pdf")}
          />
        </div>
      </div>

      {/* Aggregate Bento Metrics */}
      <SummaryStats items={items} />

      {/* Dashboard Grid System */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">

        {/* Main List Section (Wide Column) */}
        <section className="lg:col-span-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm flex flex-col">
          <PointFilters
            search={localSearch}
            setSearch={setLocalSearch}
            status={urlStatus}
            setStatus={(v) => updateParams({ status: v, page: "1" })}
            pageSize={urlPageSize}
            setPageSize={(v) => updateParams({ size: v.toString(), page: "1" })}
          />
          {/* We wrap Table to hide its internal borders/rounded corners to blend with the section */}
          <div className="[&>div]:border-0 [&>div]:shadow-none [&>div]:rounded-none">
            <PointTable
              loading={loading}
              items={paginated}
              currentPage={urlPage}
              pageSize={urlPageSize}
              totalPages={totalPages}
              totalItems={filtered.length}
              onPageChange={(p) => updateParams({ page: p.toString() })}
              onEdit={(item) => router.push(`/admin/points/edit/${item.id}`)}
              onDelete={(item) => setDeleteTarget(item)}
              onToggleStatus={handleToggleStatus}
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
              Pengaturan tipe turnamen dan distribusi poin dikontrol di halaman ini. Pastikan konfigurasi distribusi poin sesuai dengan regulasi sebelum turnamen dimulai.
            </p>
          </div>

          <ActivityLogs logs={logs} onClear={handleClearLogs} />
        </section>

      </div>

      <DeletePointModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        item={deleteTarget}
        isDeleting={isDeleting}
      />
    </div>
  );
}

export default function PointPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader /></div>}>
      <PointContent />
    </Suspense>
  );
}
