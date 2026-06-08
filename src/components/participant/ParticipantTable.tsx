import React from "react";
import Image from "next/image";
import { Edit2, Trash2, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Pagination from "../tables/Pagination";
import { Participant, STATUS_CONFIG, PAYMENT_STATUS_CONFIG, FilterParticipantStatus } from "@/app/admin/participant/types";

interface ParticipantTableProps {
  loading: boolean;
  participants: Participant[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  statusFilter: FilterParticipantStatus;
  onPageChange: (page: number) => void;
  onEdit: (p: Participant) => void;
  onDelete: (p: Participant) => void;
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div
            className={`h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${
              i === 1 ? "w-3/4" : i === 2 ? "w-1/2" : "w-full"
            }`}
          />
          {i === 1 && (
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse mt-1.5 w-1/2" />
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── Avatar helper ────────────────────────────────────────────────────────────

function getAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("/")) return url;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl) return `${supabaseUrl}/storage/v1/object/public/${url}`;
  return null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ParticipantTable({
  loading,
  participants,
  currentPage,
  pageSize,
  totalPages,
  totalItems,
  statusFilter,
  onPageChange,
  onEdit,
  onDelete,
}: ParticipantTableProps) {
  if (!loading && participants.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Users className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">Tidak ada peserta ditemukan</p>
          <p className="text-xs mt-1 text-gray-400">
            Coba ubah filter atau tambahkan peserta baru
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[900px]">
          <Table>
            {/* ─── Header ─────────────────────────────────────────────────── */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-10">
                  No
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Peserta
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Turnamen
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Pembayaran
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                  Aksi
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* ─── Body ───────────────────────────────────────────────────── */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading
                ? Array.from({ length: Math.min(pageSize, 5) }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                : participants.map((p, idx) => {
                    const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                    const sc = p.status ? STATUS_CONFIG[p.status] : null;
                    const pc = p.payment_status ? PAYMENT_STATUS_CONFIG[p.payment_status] || { label: p.payment_status, color: "text-gray-600" } : null;
                    const avatarUrl = getAvatarUrl(p.players?.avatar_url);
                    const playerName = p.players?.full_name ?? "—";
                    const initial = playerName.charAt(0).toUpperCase();

                    return (
                      <TableRow key={p.id}>
                        {/* # */}
                        <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 font-mono">
                          {globalIdx.toString().padStart(2)}
                        </TableCell>

                        {/* Player */}
                        <TableCell className="px-5 py-4 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold shrink-0 relative">
                              {avatarUrl ? (
                                <Image
                                  src={avatarUrl}
                                  alt={playerName}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                initial
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[180px]">
                                {playerName}
                              </p>
                              {p.players?.nickname && (
                                <p className="text-xs text-gray-400 truncate max-w-[180px]">
                                  {p.players.nickname}
                                </p>
                              )}
                              {p.players?.level && (
                                <span className="text-[10px] font-medium text-brand-500 dark:text-brand-400 capitalize">
                                  {p.players.level}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Tournament */}
                        <TableCell className="px-5 py-3 text-start text-theme-sm">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                            {p.tournaments?.name ?? "—"}
                          </p>
                          {p.tournaments?.start_date && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Intl.DateTimeFormat("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }).format(new Date(p.tournaments.start_date))}
                            </p>
                          )}
                        </TableCell>

                        {/* Payment */}
                        <TableCell className="px-5 py-3 text-start text-theme-sm">
                          {pc ? (
                             <span className={`text-sm font-medium ${pc.color}`}>
                               {pc.label}
                             </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-5 py-3 text-start">
                          {sc ? (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {sc.label}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="px-5 py-3 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onEdit(p)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                              title="Edit Peserta"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDelete(p)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                              title="Hapus Peserta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer */}
      {!loading && totalItems > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 dark:border-white/[0.05] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Menampilkan {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} peserta
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
