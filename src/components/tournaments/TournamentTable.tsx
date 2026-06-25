import React from "react";
import { Edit2, Trash2, Calendar, MapPin, Users, Trophy } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Pagination from "../tables/Pagination";
import { Tournament, STATUS_CONFIG, FilterStatus } from "@/app/admin/tournaments/types";

interface TournamentTableProps {
  loading: boolean;
  tournaments: Tournament[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  filter: FilterStatus;
  onPageChange: (page: number) => void;
  onEdit: (t: Tournament) => void;
  onDelete: (t: Tournament) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatCurrency(val: number) {
  if (val === 0) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(val);
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 10 }).map((_, i) => (
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TournamentTable({
  loading,
  tournaments,
  currentPage,
  pageSize,
  totalPages,
  totalItems,
  filter,
  onPageChange,
  onEdit,
  onDelete,
}: TournamentTableProps) {
  if (!loading && tournaments.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Trophy className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">Tidak ada turnamen ditemukan</p>
          <p className="text-xs mt-1 text-gray-400">
            Coba ubah filter atau tambahkan turnamen baru
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block max-w-full overflow-x-auto">
        <div className="min-w-[1000px]">
          <Table>
            {/* ─── Header ─────────────────────────────────────────────────── */}
            <TableHeader className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none w-10 text-center">
                  No
                </TableCell>
                <TableCell isHeader className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">
                  Turnamen
                </TableCell>
                <TableCell isHeader className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">
                  Lokasi
                </TableCell>
                <TableCell isHeader className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">
                  Status
                </TableCell>
                <TableCell isHeader className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">
                  Tanggal
                </TableCell>
                <TableCell isHeader className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">
                  Deadline
                </TableCell>
                <TableCell isHeader className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">
                  Peserta
                </TableCell>
                <TableCell isHeader className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">
                  Biaya
                </TableCell>
                <TableCell isHeader className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">
                  Hadiah
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
                : tournaments.map((t, idx) => {
                    const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                    const sc = STATUS_CONFIG[t.status];
                    return (
                      <TableRow key={t.id}>
                        {/* # */}
                        <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 font-mono">
                          {globalIdx.toString().padStart(2)}
                        </TableCell>

                        {/* Name + type */}
                        <TableCell className="px-5 py-4 text-start">
                          <div className="flex items-start gap-3">
                            {/* <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0">
                              <Trophy className="w-4 h-4 text-white" />
                            </div> */}
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[220px]">
                                {t.name}
                              </p>
                              {t.points?.name && (
                                <p className="text-xs text-brand-500 dark:text-brand-400 font-medium mt-0.5">
                                  {t.points.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Location */}
                        <TableCell className="px-5 py-3 text-start text-theme-sm text-gray-700 dark:text-gray-300">
                          {t.location ? (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate max-w-[150px]">{t.location}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-5 py-3 text-start">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                            {sc.label}
                          </span>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="px-8 py-3 text-start text-theme-sm">
                          <div className="flex items-start gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                {formatDate(t.start_date)}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Deadline */}
                        <TableCell className="px-5 py-3 text-start text-theme-sm">
                          {t.registration_deadline ? (
                            <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">
                              {formatDate(t.registration_deadline)}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </TableCell>

                        {/* Participants */}
                        <TableCell className="px-5 py-3 text-start text-theme-sm">
                          {t.max_participants ? (
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {t.max_participants}
                              </span>
                              <span className="text-xs text-gray-400">max</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </TableCell>

                        {/* Entry Fee */}
                        <TableCell className="px-5 py-3 text-start text-theme-sm">
                          {t.entry_fee > 0 ? (
                            <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                              {formatCurrency(t.entry_fee)}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </TableCell>

                        {/* Prize Pool */}
                        <TableCell className="px-5 py-3 text-start text-theme-sm">
                          {t.prize_pool > 0 ? (
                            <span className="font-semibold text-green-600 dark:text-green-400 text-sm">
                              {formatCurrency(t.prize_pool)}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="px-5 py-3 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              id={`btn-edit-${t.id}`}
                              onClick={() => onEdit(t)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                              title="Edit Turnamen"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn-delete-${t.id}`}
                              onClick={() => onDelete(t)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                              title="Hapus Turnamen"
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

      {/* MOBILE ADAPTIVE CARD VIEW */}
      <div className="md:hidden p-4 space-y-4 bg-slate-50 dark:bg-gray-900/50">
        {loading ? (
          Array.from({ length: Math.min(pageSize, 3) }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded mt-1.5 w-1/2" />
              <div className="border-t border-b border-gray-100 dark:border-gray-700 py-3 space-y-2">
                 <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                 <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              </div>
              <div className="flex justify-end gap-2">
                 <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                 <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
              </div>
            </div>
          ))
        ) : (
          tournaments.map((t) => {
            const sc = STATUS_CONFIG[t.status];
            return (
              <div 
                key={t.id}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1 pr-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{t.name}</h4>
                    {t.points?.name && (
                      <span className="text-xs text-brand-500 dark:text-brand-400 font-medium">
                        {t.points.name}
                      </span>
                    )}
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${sc.bg} ${sc.text}`}
                  >
                    {sc.label}
                  </span>
                </div>

                <div className="border-t border-b border-gray-100 dark:border-gray-700 py-3 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 dark:text-gray-500 font-bold tracking-wider uppercase text-[9px]">Lokasi:</span>
                    <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="truncate max-w-[150px] font-medium">{t.location || "—"}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 dark:text-gray-500 font-bold tracking-wider uppercase text-[9px]">Tanggal:</span>
                    <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="font-medium">{formatDate(t.start_date)}</span>
                    </div>
                  </div>
                  {t.registration_deadline && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 dark:text-gray-500 font-bold tracking-wider uppercase text-[9px]">Deadline:</span>
                      <span className="text-amber-600 dark:text-amber-500 font-medium">{formatDate(t.registration_deadline)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 dark:text-gray-500 font-bold tracking-wider uppercase text-[9px]">Peserta Max:</span>
                    {t.max_participants ? (
                      <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">{t.max_participants}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 dark:text-gray-500 font-bold tracking-wider uppercase text-[9px]">Biaya:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">{t.entry_fee > 0 ? formatCurrency(t.entry_fee) : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 dark:text-gray-500 font-bold tracking-wider uppercase text-[9px]">Hadiah:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{t.prize_pool > 0 ? formatCurrency(t.prize_pool) : "—"}</span>
                  </div>
                </div>

                {/* Mobile actions */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => onEdit(t)}
                    className="flex-1 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(t)}
                    className="flex-1 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    Hapus
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {!loading && totalItems > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 dark:border-white/[0.05] flex flex-col sm:flex-row items-center sm:justify-between gap-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
            Menampilkan <strong className="text-slate-900 dark:text-white">{(currentPage - 1) * pageSize + 1}</strong> -{" "}
            <strong className="text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, totalItems)} </strong> dari <strong className="text-slate-900 dark:text-white">{totalItems}</strong> turnamen
            {filter !== "all" && (
              <span> · Filter: {STATUS_CONFIG[filter as Exclude<FilterStatus, "all">]?.label}</span>
            )}
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
