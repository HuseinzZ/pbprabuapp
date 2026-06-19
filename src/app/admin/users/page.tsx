"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { syncAllPlayerPoints } from "@/lib/actions/point";
import { User, FilterLevel } from "./types";
import TableUsers from "@/components/users/TableUsers";
import UserFilters from "@/components/users/UserFilters";
import SummaryStats from "@/components/users/SummaryStats";
import ActivityLogs from "@/components/users/ActivityLogs";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ExportButtons from "@/components/common/ExportButtons";
import Loader from "@/components/shared/Loader";
import { exportCSV, exportPDF, exportJSON } from "@/lib/utils/export";
import PrintReport, { PrintColumn } from "@/components/common/PrintReport";
import DeleteUserModal from "@/components/users/DeleteUserModal";
import { deleteStorageFile } from "@/lib/utils/storage";
import { ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";

// ─── Content Component ────────────────────────────────────────────────────────
function UsersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const urlFilter = (searchParams.get("filter") as FilterLevel) || "all";
  const urlSearch = searchParams.get("search") || "";
  const urlPageSize = Number(searchParams.get("size")) || 10;
  const urlPage = Number(searchParams.get("page")) || 1;
  const urlStatusFilter = searchParams.get("status") || "all";
  const urlSortBy = searchParams.get("sort") || "name_asc";

  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const storedLogs = localStorage.getItem('manajemen_pengguna_logs');
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
      localStorage.setItem('manajemen_pengguna_logs', JSON.stringify(updatedLogs));
      return updatedLogs;
    });
  }, []);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('manajemen_pengguna_logs');
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

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("profile")
      .select(`
        id, fullname, username, avatar_url, birth_date, gender, address,
        height, hand_dominance, level, ranking_points, ranking_position,
        is_active, joined_at, user_id, role, created_at
      `)
      .order("ranking_points", { ascending: false });

    const { data, error } = await query;

    let emailMap: Record<string, string> = {};
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const result = await res.json();
        if (result.emailMap) emailMap = result.emailMap;
      }
    } catch (e) {
      console.error("Gagal mengambil data email", e);
    }

    if (!error && data) {
      const mapped: User[] = data.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        fullname: p.fullname ?? "",
        username: p.username,
        avatar_url: p.avatar_url,
        birth_date: p.birth_date,
        gender: p.gender,
        address: p.address,
        height: p.height,
        hand_dominance: p.hand_dominance,
        level: p.level,
        ranking_points: p.ranking_points ?? 0,
        ranking_position: p.ranking_position,
        is_active: p.is_active ?? true,
        joined_at: p.joined_at,
        email: (p.user_id && emailMap[p.user_id]) ? emailMap[p.user_id] : null,
        role: p.role ?? "user",
        created_at: p.created_at ?? null,
      }));
      setUsers(mapped);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);

    if (deleteTarget.avatar_url) {
      await deleteStorageFile(deleteTarget.avatar_url, "avatars");
    }

    const { error: profileErr } = await supabase
      .from("profile")
      .delete()
      .eq("id", deleteTarget.id);

    if (profileErr) {
      toast.error("Gagal menghapus profil: " + profileErr.message);
      setIsDeleting(false);
      return;
    }

    if (deleteTarget.user_id) {
      await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.user_id }),
      });
    }

    addLog(`Sistem menghapus data pengguna @${deleteTarget.username || deleteTarget.fullname}`, 'delete');
    toast.success("Berhasil menghapus pengguna!");
    setIsDeleting(false);
    setDeleteTarget(null);
    fetchUsers();
  }

  const handleSyncPoints = async () => {
    setSyncing(true);
    try {
      // 1. Hitung total poin per player dari point_histories
      const { data: histories, error: hErr } = await supabase
        .from("point_histories")
        .select("player_id, points_earned");

      if (hErr) {
        toast.error("Gagal mengambil riwayat poin: " + hErr.message);
        setSyncing(false);
        return;
      }

      const totals: Record<string, number> = {};
      for (const h of (histories || [])) {
        if (h.player_id) {
          totals[h.player_id] = (totals[h.player_id] || 0) + h.points_earned;
        }
      }

      // 2. Ambil semua profile untuk mencocokkan player_id
      const { data: profiles, error: pErr } = await supabase
        .from("profile")
        .select("id, user_id, ranking_points");

      if (pErr) {
        toast.error("Gagal mengambil data profil: " + pErr.message);
        setSyncing(false);
        return;
      }

      // 3. Update profile.ranking_points yang tidak sesuai
      const updateTasks: (() => Promise<any>)[] = [];
      let updatedCount = 0;
      for (const profile of (profiles || [])) {
        const correctPoints = totals[profile.id] || 0;
        if (profile.ranking_points !== correctPoints) {
          const profileId = profile.id;
          updateTasks.push(async () => {
            await supabase
              .from("profile")
              .update({ ranking_points: correctPoints })
              .eq("id", profileId);
          });
          updatedCount++;
        }
      }

      if (updateTasks.length > 0) {
        await Promise.all(updateTasks.map((fn) => fn()));
      }

      // 4. Juga sinkronisasi tabel players (jika ada) via fungsi yang sudah ada
      // silent=true agar tidak ada toast duplikat
      await syncAllPlayerPoints(supabase, true);

      await fetchUsers();
      addLog(`Sinkronisasi poin selesai — ${updatedCount} profil diperbarui`, 'update');
      toast.success(`Sinkronisasi poin berhasil! ${updatedCount} profil diperbarui.`);
    } catch (err: any) {
      toast.error("Terjadi kesalahan saat sinkronisasi: " + (err?.message || err));
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = !user.is_active;
    // Optimistic update
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: newStatus } : u));
    
    // Call API or Supabase
    const { error } = await supabase.from("profile").update({ is_active: newStatus }).eq("id", user.id);
    if (error) {
      // Revert if error
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !newStatus } : u));
      toast.error("Gagal mengubah status: " + error.message);
    } else {
      toast.success(`Status ${user.fullname} berhasil diubah!`);
      addLog(`Status @${user.fullname} diubah menjadi ${newStatus ? 'Aktif' : 'Nonaktif'}`, 'status_toggle');
    }
  };

  // Filter & Pagination logic (Client side filtered from all users)
  let filtered = users.filter((p) => {
    const matchSearch = 
      (p.fullname ?? "").toLowerCase().includes(urlSearch.toLowerCase()) ||
      (p.email ?? "").toLowerCase().includes(urlSearch.toLowerCase()) ||
      (p.username ?? "").toLowerCase().includes(urlSearch.toLowerCase());
      
    const matchLevel = urlFilter === "all" || p.level === urlFilter;
    const matchStatus = urlStatusFilter === "all" || 
      (urlStatusFilter === "active" ? p.is_active : !p.is_active);

    return matchSearch && matchLevel && matchStatus;
  });

  filtered.sort((a, b) => {
    switch (urlSortBy) {
      case "name_asc": return (a.fullname || "").localeCompare(b.fullname || "");
      case "name_desc": return (b.fullname || "").localeCompare(a.fullname || "");
      case "username_asc": return (a.username || "").localeCompare(b.username || "");
      case "username_desc": return (b.username || "").localeCompare(a.username || "");
      case "email_asc": return (a.email || "").localeCompare(b.email || "");
      case "joined_desc": 
        return new Date(b.joined_at || b.created_at || "").getTime() - new Date(a.joined_at || a.created_at || "").getTime();
      case "joined_asc": 
        return new Date(a.joined_at || a.created_at || "").getTime() - new Date(b.joined_at || b.created_at || "").getTime();
      case "points_desc": return (b.ranking_points || 0) - (a.ranking_points || 0);
      default: return 0;
    }
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / urlPageSize));
  const paginatedUsers = filtered.slice((urlPage - 1) * urlPageSize, urlPage * urlPageSize);

  const printColumns: PrintColumn[] = [
    { key: "no", label: "No", width: "5%" },
    { key: "name", label: "Nama", width: "25%" },
    { key: "username", label: "Username", width: "15%" },
    { key: "email", label: "Email", width: "20%" },
    { key: "role", label: "Role", width: "10%", align: "center" },
    { key: "level", label: "Level", width: "10%", align: "center" },
    { key: "points", label: "Poin", width: "10%", align: "center" },
    { key: "status", label: "Status", width: "10%", align: "center" },
  ];

  const printGroups = [
    {
      name: `Daftar User (${filtered.length} Orang)`,
      rows: filtered.map((p, i) => ({
        no: i + 1,
        name: p.fullname,
        username: p.username || "-",
        email: p.email || "-",
        role: p.role,
        level: p.level || "-",
        points: p.ranking_points,
        status: p.is_active ? "Aktif" : "Nonaktif",
      })),
    },
  ];

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb pageTitle="Manajemen User" />
        <div className="flex items-center justify-end">
          <ExportButtons
          disabled={loading || users.length === 0}
          onExportCSV={() =>
            exportCSV(
              "users.csv",
              ["No", "Nama", "Username", "Email", "Role", "Level", "Poin", "Status"],
              filtered.map((p, i) => [
                i + 1,
                p.fullname,
                p.username ?? "-",
                p.email ?? "-",
                p.role,
                p.level ?? "-",
                p.ranking_points,
                p.is_active ? "Aktif" : "Nonaktif",
              ])
            )
          }
          onExportJSON={() =>
            exportJSON("users.json", filtered.map((p, i) => ({
                no: i + 1,
                name: p.fullname,
                username: p.username || "-",
                email: p.email || "-",
                role: p.role,
                level: p.level || "-",
                points: p.ranking_points,
                status: p.is_active ? "Aktif" : "Nonaktif",
            })))
          }
          onExportPDF={() => exportPDF("print-users", "Users.pdf")}
        />
        </div>
      </div>

      {/* Aggregate Bento Metrics */}
      <SummaryStats users={users} />

      {/* Dashboard Grid System */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Main User List Section (Wide Column) */}
        <section className="lg:col-span-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm flex flex-col">
          <UserFilters
            filter={urlFilter}
            setFilter={(val) => updateQueryParams({ filter: val, page: "1" })}
            statusFilter={urlStatusFilter}
            setStatusFilter={(val) => updateQueryParams({ status: val, page: "1" })}
            sortBy={urlSortBy}
            setSortBy={(val) => updateQueryParams({ sort: val, page: "1" })}
            search={localSearch}
            setSearch={setLocalSearch}
            pageSize={urlPageSize}
            setPageSize={(val) => updateQueryParams({ size: val.toString(), page: "1" })}
            onSyncPoints={handleSyncPoints}
            syncing={syncing}
          />
          {/* We wrap TableUsers to hide its internal borders/rounded corners to blend with the section */}
          <div className="[&>div]:border-0 [&>div]:shadow-none [&>div]:rounded-none">
            <TableUsers
              loading={loading}
              users={paginatedUsers}
              filter={urlFilter}
              currentPage={urlPage}
              pageSize={urlPageSize}
              totalPages={totalPages}
              totalUsers={filtered.length}
              onPageChange={(page) => updateQueryParams({ page: page.toString() })}
              onEditUser={(p) => router.push(`/admin/users/edit/${p.id}`)}
              onDeleteUser={(p) => setDeleteTarget(p)}
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
              Pengaturan peran (role), status akun (aktif/nonaktif), dan validasi pengguna dikontrol secara langsung oleh sistem. Jika Anda menemukan ketidaksesuaian antara jumlah poin pada profil dan poin turnamen, klik tombol <b>"Sync Poin"</b> pada panel pencarian.
            </p>
            <div className="pt-3 border-t border-slate-100 dark:border-gray-800 text-[11px] font-semibold text-slate-400 dark:text-gray-500 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Sinkronisasi Auth User (Supabase)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Level Akses Terproteksi (Admin)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span>Real-time Status Update Aktif</span>
              </div>
            </div>
          </div>
          
          <ActivityLogs logs={logs} onClear={handleClearLogs} />
        </section>

      </div>

      <DeleteUserModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        player={deleteTarget}
        isDeleting={isDeleting}
      />

      <PrintReport
        title="Daftar User PB Prabu"
        subtitle={urlFilter !== "all" ? `Filter Level: ${urlFilter.toUpperCase()}` : "Semua Level"}
        columns={printColumns}
        groups={printGroups}
        printId="print-users"
      />
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader /></div>}>
      <UsersPageContent />
    </Suspense>
  );
}