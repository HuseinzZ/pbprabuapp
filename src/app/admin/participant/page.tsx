"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Participant, FilterParticipantStatus } from "./types";

import ParticipantTable from "@/components/participant/ParticipantTable";
import ParticipantFilters from "@/components/participant/ParticipantFilters";
import DeleteParticipantModal from "@/components/participant/DeleteParticipantModal";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loader from "@/components/shared/Loader";
import ExportButtons from "@/components/common/ExportButtons";
import PrintReport, { PrintColumn } from "@/components/common/PrintReport";
import { exportCSV, exportPDF } from "@/lib/utils/export";

// ─── Content ──────────────────────────────────────────────────────────────────

function ParticipantContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const urlSearch = searchParams.get("search") || "";
  const urlStatus = (searchParams.get("status") as FilterParticipantStatus) || "all";
  const urlDate = searchParams.get("date") || "";
  const urlTournamentId = searchParams.get("tournament_id") || "";
  const urlPageSize = Number(searchParams.get("size")) || 10;
  const urlPage = Number(searchParams.get("page")) || 1;

  const [localSearch, setLocalSearch] = useState(urlSearch);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [tournaments, setTournaments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Participant | null>(null);
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

  // Fetch tournaments for filter dropdown
  useEffect(() => {
    supabase
      .from("tournaments")
      .select("id, name")
      .order("start_date", { ascending: false })
      .then(({ data }) => setTournaments(data ?? []));
  }, [supabase]);

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("tournament_participants")
      .select("*, players(full_name, nickname, email, phone, avatar_url, level, ranking_points), tournaments(name, status, start_date)")
      .order("registered_at", { ascending: false });

    if (urlStatus !== "all") query = query.eq("status", urlStatus);
    if (urlTournamentId) query = query.eq("tournament_id", urlTournamentId);
    if (urlDate) query = query.gte("tournaments.start_date", urlDate);

    const { data } = await query;
    setParticipants((data as Participant[]) ?? []);
    setLoading(false);
  }, [urlStatus, urlTournamentId, urlDate, supabase]);

  useEffect(() => { fetchParticipants(); }, [fetchParticipants]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await supabase.from("tournament_participants").delete().eq("id", deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);
    fetchParticipants();
  }

  const filtered = participants.filter((p) => {
    const name = p.players?.full_name ?? "";
    const nickname = p.players?.nickname ?? "";
    const q = urlSearch.toLowerCase();
    return name.toLowerCase().includes(q) || nickname.toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / urlPageSize));
  const paginated = filtered.slice((urlPage - 1) * urlPageSize, urlPage * urlPageSize);

  const printColumns: PrintColumn[] = [
    { key: "no", label: "No", width: "5%" },
    { key: "name", label: "Nama Pemain", width: "25%" },
    { key: "tournament", label: "Turnamen", width: "30%" },
    { key: "status", label: "Status", width: "20%", align: "center" },
    { key: "registeredAt", label: "Tanggal Daftar", width: "20%" },
  ];

  const printGroups = [
    {
      name: `Daftar Peserta (${filtered.length} Orang)`,
      rows: filtered.map((p, i) => ({
        no: i + 1,
        name: p.players?.full_name ?? "-",
        tournament: p.tournaments?.name ?? "-",
        status: p.status,
        registeredAt: new Date(p.registered_at).toLocaleString("id-ID"),
      })),
    },
  ];

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Peserta Turnamen" />

      <div className="flex items-end justify-end gap-3">
        <ExportButtons
          disabled={loading}
          onExportCSV={() =>
            exportCSV(
              "peserta_turnamen.csv",
              ["No", "Nama Pemain", "Turnamen", "Status", "Tanggal Daftar"],
              filtered.map((p, i) => [
                i + 1,
                p.players?.full_name ?? "-",
                p.tournaments?.name ?? "-",
                p.status,
                new Date(p.registered_at).toLocaleString("id-ID"),
              ])
            )
          }
          onExportPDF={() => exportPDF("print-participants", "Peserta_Turnamen.pdf")}
        />
      </div>

      <ParticipantFilters
        search={localSearch}
        setSearch={setLocalSearch}
        status={urlStatus}
        setStatus={(v) => updateParams({ status: v, page: "1" })}
        tournamentDate={urlDate}
        setTournamentDate={(v) => updateParams({ date: v || null, page: "1" })}
        tournamentId={urlTournamentId}
        setTournamentId={(v) => updateParams({ tournament_id: v || null, page: "1" })}
        tournaments={tournaments}
        pageSize={urlPageSize}
        setPageSize={(v) => updateParams({ size: v.toString(), page: "1" })}
      />

      <ParticipantTable
        loading={loading}
        participants={paginated}
        currentPage={urlPage}
        pageSize={urlPageSize}
        totalPages={totalPages}
        totalItems={filtered.length}
        statusFilter={urlStatus}
        onPageChange={(p) => updateParams({ page: p.toString() })}
        onEdit={(p) => router.push(`/admin/participant/edit/${p.id}`)}
        onDelete={(p) => setDeleteTarget(p)}
      />

      <DeleteParticipantModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        participant={deleteTarget}
        isDeleting={isDeleting}
      />

      <PrintReport
        title="Daftar Peserta Turnamen PB Prabu"
        subtitle={urlTournamentId ? tournaments.find(t => t.id === urlTournamentId)?.name : "Semua Turnamen"}
        columns={printColumns}
        groups={printGroups}
        printId="print-participants"
      />
    </div>
  );
}

export default function ParticipantPage() {
  return (
    <Suspense fallback={<div className="p-6"><Loader /></div>}>
      <ParticipantContent />
    </Suspense>
  );
}
