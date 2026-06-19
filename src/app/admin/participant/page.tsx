"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Participant, FilterParticipantStatus } from "./types";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Loader from "@/components/shared/Loader";
import SummaryStats from "@/components/participant/SummaryStats";
import ParticipantMasterDetail from "@/components/participant/ParticipantMasterDetail";
import SecurityAndAuditPanel from "@/components/participant/SecurityAndAuditPanel";
import { toast } from "react-toastify";
import ExportButtons from "@/components/common/ExportButtons";
import { exportCSV, exportJSON, exportPDF } from "@/lib/utils/export";
import PrintReport, { PrintColumn } from "@/components/common/PrintReport";

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
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const storedLogs = localStorage.getItem('manajemen_peserta_logs');
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
      localStorage.setItem('manajemen_peserta_logs', JSON.stringify(updatedLogs));
      return updatedLogs;
    });
  }, []);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
    localStorage.removeItem('manajemen_peserta_logs');
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

  // Fetch tournaments
  useEffect(() => {
    supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setTournaments(data as any ?? []));
  }, [supabase]);

  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tournament_participants")
      .select("*, profile(fullname, username, avatar_url, level, ranking_points), tournaments(name, status, start_date)")
      .order("registered_at", { ascending: false });

    setParticipants((data as Participant[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchParticipants(); }, [fetchParticipants]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb pageTitle="Peserta Turnamen" />
        <div className="flex items-center justify-end">
          <ExportButtons
            disabled={loading || participants.length === 0}
            onExportCSV={() => exportCSV(
              "peserta_turnamen.csv",
              ["No", "Turnamen", "Nama Peserta", "Level Ranking", "Poin", "Status", "Tanggal Daftar"],
              participants.map((p, i) => [
                i + 1, 
                p.tournaments?.name || "-", 
                p.profile?.fullname || "-", 
                p.profile?.level || "-", 
                p.profile?.ranking_points || 0,
                p.status || "-",
                p.registered_at ? new Date(p.registered_at).toLocaleDateString("id-ID") : "-"
              ])
            )}
            onExportJSON={() => exportJSON("peserta_turnamen.json", participants.map((p) => ({
              id: p.id,
              tournament_name: p.tournaments?.name || "-",
              fullname: p.profile?.fullname || "-",
              level: p.profile?.level || "-",
              ranking_points: p.profile?.ranking_points || 0,
              status: p.status || "-",
              registered_at: p.registered_at ? new Date(p.registered_at).toLocaleDateString("id-ID") : "-"
            })))}
            onExportPDF={() => exportPDF("print-participant", "Peserta_Turnamen.pdf")}
          />
        </div>
      </div>

      <SummaryStats participants={participants} />

      <ParticipantMasterDetail 
        tournaments={tournaments as any}
        participants={participants}
        fetchParticipants={fetchParticipants}
        onAddLog={addLog}
      />

      <SecurityAndAuditPanel logs={logs} />

      <PrintReport
        title="Daftar Peserta Turnamen"
        subtitle="Data Peserta PB Prabu"
        columns={[
          { label: "No", key: "no", width: "10%" },
          { label: "Turnamen", key: "tournament", width: "25%" },
          { label: "Nama Peserta", key: "fullname", width: "25%" },
          { label: "Level", key: "level", width: "15%" },
          { label: "Poin", key: "points", width: "10%" },
          { label: "Status", key: "status", width: "15%" },
        ]}
        groups={[{
          name: "Semua Peserta",
          rows: participants.map((p, i) => ({
            no: i + 1,
            tournament: p.tournaments?.name || "-",
            fullname: p.profile?.fullname || "-",
            level: p.profile?.level || "-",
            points: p.profile?.ranking_points || 0,
            status: p.status || "-",
          }))
        }]}
        printId="print-participant"
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
