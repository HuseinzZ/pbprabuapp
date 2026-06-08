import React from "react";
import { Edit2, Trash2, AlertCircle, Trophy } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Pagination from "../tables/Pagination";
import { TournamentType } from "@/app/admin/tournament-type/types";

interface TournamentTypeTableProps {
  loading: boolean;
  items: TournamentType[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onEdit: (item: TournamentType) => void;
  onDelete: (item: TournamentType) => void;
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ─── Points Badge ──────────────────────────────────────────────────────────────

function PointsBadge({ value }: { value: number | null }) {
  if (value === null || value === 0) {
    return <span className="text-gray-400 text-xs">—</span>;
  }
  return (
    <span className="font-semibold text-gray-900 dark:text-white">
      {value.toLocaleString()}
    </span>
  );
}

// ─── Main Table Component ─────────────────────────────────────────────────────

export default function TournamentTypeTable({
  loading,
  items,
  currentPage,
  pageSize,
  totalPages,
  totalItems,
  onPageChange,
  onEdit,
  onDelete,
}: TournamentTypeTableProps) {
  if (!loading && items.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Trophy className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm font-medium">Tidak ada tipe turnamen ditemukan</p>
          <p className="text-xs mt-1 text-gray-400">Coba ubah filter atau tambahkan tipe baru</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[1100px]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  No
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Nama Tipe
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Winner
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Finalist
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Semi Final
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  QF
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  R16 / R32
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-end text-theme-xs dark:text-gray-400">
                  Aksi
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {loading
                ? Array.from({ length: pageSize > 5 ? 5 : pageSize }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                : items.map((item, idx) => {
                    const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <TableRow key={item.id}>
                        {/* # */}
                        <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 font-mono">
                          {globalIdx.toString().padStart(2)}
                        </TableCell>

                        {/* Name */}
                        <TableCell className="px-5 py-4 text-start">
                          <div className="flex items-center gap-2.5">
                            {/* <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0">
                              <Trophy className="w-4 h-4 text-white" />
                            </div> */}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-sm">
                                {item.name}
                              </p>
                              {item.description && (
                                <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Winner */}
                        <TableCell className="px-5 py-3 text-start text-theme-sm">
                          <span className="font-semibold text-amber-600 dark:text-amber-400">
                            {item.points_winner.toLocaleString()}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">pts</span>
                        </TableCell>

                        {/* Finalist */}
                        <TableCell className="px-5 py-3 text-start text-theme-sm">
                          <PointsBadge value={item.points_finalist} />
                          {item.points_finalist > 0 && (
                            <span className="text-xs text-gray-400 ml-1">pts</span>
                          )}
                        </TableCell>

                        {/* SF */}
                        <TableCell className="px-5 py-3 text-start text-theme-sm">
                          <PointsBadge value={item.points_semifinalist} />
                          {item.points_semifinalist > 0 && (
                            <span className="text-xs text-gray-400 ml-1">pts</span>
                          )}
                        </TableCell>

                        {/* QF */}
                        <TableCell className="px-5 py-3 text-start text-theme-sm">
                          <PointsBadge value={item.points_quarterfinalist} />
                          {item.points_quarterfinalist > 0 && (
                            <span className="text-xs text-gray-400 ml-1">pts</span>
                          )}
                        </TableCell>

                        {/* R16 / R32 combined */}
                        <TableCell className="px-5 py-3 text-start text-theme-sm">
                          <div className="flex flex-col gap-0.5">
                            {(item.points_r16 ?? 0) > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                R16:{" "}
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {(item.points_r16 ?? 0).toLocaleString()}
                                </span>
                              </span>
                            )}
                            {(item.points_r32 ?? 0) > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                R32:{" "}
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {(item.points_r32 ?? 0).toLocaleString()}
                                </span>
                              </span>
                            )}
                            {!(item.points_r16 ?? 0) && !(item.points_r32 ?? 0) && (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-5 py-3 text-start text-theme-sm">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              item.is_active
                                ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.is_active ? "bg-green-500" : "bg-gray-400"
                              }`}
                            />
                            {item.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="px-5 py-3 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              id={`btn-edit-${item.id}`}
                              onClick={() => onEdit(item)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                              title="Edit Tipe Turnamen"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              id={`btn-delete-${item.id}`}
                              onClick={() => onDelete(item)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                              title="Hapus Tipe Turnamen"
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

      {/* Footer Pagination */}
      {!loading && totalItems > 0 && (
        <div className="px-5 py-4 border-t border-gray-100 dark:border-white/[0.05] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Menampilkan {(currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, totalItems)} dari {totalItems} tipe
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
