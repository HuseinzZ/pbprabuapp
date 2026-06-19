import React from "react";
import { Edit, Trash2, ShieldAlert, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { Point } from "@/app/admin/points/types";

interface PointTableProps {
  loading: boolean;
  items: Point[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onEdit: (item: Point) => void;
  onDelete: (item: Point) => void;
  onToggleStatus?: (item: Point) => void;
}

export default function PointTable({
  loading,
  items,
  currentPage,
  pageSize,
  totalPages,
  totalItems,
  onPageChange,
  onEdit,
  onDelete,
  onToggleStatus,
}: PointTableProps) {
  
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg shadow-sm flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const PointsBadge = ({ value }: { value: number | null }) => {
    if (value === null || value === 0) {
      return <span className="text-gray-400 text-xs">—</span>;
    }
    return (
      <span className="font-semibold text-gray-900 dark:text-white">
        {value.toLocaleString()}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg shadow-sm flex flex-col">
      <div className="flex-1 w-full overflow-x-auto">
        {items.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-500 rounded-2xl">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Data tidak ditemukan</h3>
              <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
                Tidak ada tipe turnamen yang sesuai dengan filter/pencarian Anda.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none w-10 text-center">NO.</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">NAMA TIPE</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">WINNER</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">FINALIST</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">SEMI FINAL</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">QUARTER FINAL</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">R16/R32/R64</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">STATUS</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-gray-800">
                {items.map((item, index) => {
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition duration-150"
                    >
                      {/* No. */}
                      <td className="p-4 whitespace-nowrap text-xs font-medium text-slate-500 dark:text-gray-400 text-center">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* Name block */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 text-white font-bold flex items-center justify-center rounded shadow-sm ring-1 ring-slate-200 dark:ring-gray-700 select-none relative overflow-hidden shrink-0`}>
                            <Trophy className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800 dark:text-white">
                              {item.name}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 max-w-[150px] truncate">
                              {item.description || "—"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Winner */}
                      <td className="p-4 whitespace-nowrap text-xs">
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {item.points_winner.toLocaleString()} pts
                        </span>
                      </td>

                      {/* Finalist */}
                      <td className="p-4 whitespace-nowrap text-xs">
                        <PointsBadge value={item.points_finalist} />
                        {item.points_finalist > 0 && <span className="text-xs text-gray-400 ml-1">pts</span>}
                      </td>

                      {/* Semifinal */}
                      <td className="p-4 whitespace-nowrap text-xs">
                        <PointsBadge value={item.points_semifinalist} />
                        {item.points_semifinalist > 0 && <span className="text-xs text-gray-400 ml-1">pts</span>}
                      </td>

                      {/* Quarterfinal */}
                      <td className="p-4 whitespace-nowrap text-xs">
                        <PointsBadge value={item.points_quarterfinalist} />
                        {item.points_quarterfinalist > 0 && <span className="text-xs text-gray-400 ml-1">pts</span>}
                      </td>

                      {/* R16 / R32 */}
                      <td className="p-4 whitespace-nowrap text-xs">
                        <div className="flex flex-col gap-0.5">
                          {(item.points_r16 ?? 0) > 0 && (
                            <span className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                              R16: <span className="text-slate-800 dark:text-white">{(item.points_r16 ?? 0).toLocaleString()}</span>
                            </span>
                          )}
                          {(item.points_r32 ?? 0) > 0 && (
                            <span className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                              R32: <span className="text-slate-800 dark:text-white">{(item.points_r32 ?? 0).toLocaleString()}</span>
                            </span>
                          )}
                          {(item.points_r64 ?? 0) > 0 && (
                            <span className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                              R64: <span className="text-slate-800 dark:text-white">{(item.points_r64 ?? 0).toLocaleString()}</span>
                            </span>
                          )}
                          {!(item.points_r16 ?? 0) && !(item.points_r32 ?? 0) && !(item.points_r64 ?? 0) && (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>

                      {/* Status toggle */}
                      <td className="p-4 whitespace-nowrap">
                        <button
                          onClick={() => onToggleStatus && onToggleStatus(item)}
                          disabled={!onToggleStatus}
                          title={onToggleStatus ? "Klik untuk mengubah status" : ""}
                          className={`group/toggle flex items-center gap-2 text-left bg-transparent border-0 outline-none ${onToggleStatus ? "cursor-pointer" : "cursor-default"}`}
                        >
                          <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 relative shrink-0 ${
                            item.is_active ? "bg-emerald-500" : "bg-slate-300 dark:bg-gray-600"
                          }`}>
                            <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200 shadow-sm ${
                              item.is_active ? "translate-x-3.5" : "translate-x-0"
                            }`} />
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            item.is_active ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400 dark:text-gray-500"
                          }`}>
                            {item.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </button>
                      </td>

                      {/* Controls block */}
                      <td className="p-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onEdit(item)}
                            title="Edit data tipe turnamen"
                            className="p-1.5 border border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 rounded hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition duration-150 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(item)}
                            title="Hapus tipe turnamen"
                            className="p-1.5 border border-slate-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-800 rounded hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition duration-150 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* MOBILE ADAPTIVE CARD VIEW */}
            <div className="md:hidden p-4 space-y-4 bg-slate-50 dark:bg-gray-900/50">
              {items.map((item) => {
                return (
                  <div 
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 text-white font-bold flex items-center justify-center rounded-lg relative overflow-hidden`}>
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{item.name}</h4>
                          <span className="text-[10px] text-slate-500 dark:text-gray-400 truncate max-w-[180px] block mt-0.5">
                            {item.description || "—"}
                          </span>
                        </div>
                      </div>

                      {/* Status toggle */}
                      <button
                        onClick={() => onToggleStatus && onToggleStatus(item)}
                        disabled={!onToggleStatus}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition ${
                          item.is_active 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" 
                            : "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400"
                        }`}
                      >
                        {item.is_active ? "Aktif" : "Nonaktif"}
                      </button>
                    </div>

                    <div className="border-t border-b border-slate-100 dark:border-gray-700 py-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-gray-500 font-bold tracking-wider uppercase text-[9px]">Winner:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">{item.points_winner.toLocaleString()} pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-gray-500 font-bold tracking-wider uppercase text-[9px]">Finalist:</span>
                        <span className="font-semibold text-slate-800 dark:text-gray-300">
                          <PointsBadge value={item.points_finalist} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-gray-500 font-bold tracking-wider uppercase text-[9px]">Semi Final:</span>
                        <span className="font-semibold text-slate-800 dark:text-gray-300">
                          <PointsBadge value={item.points_semifinalist} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-gray-500 font-bold tracking-wider uppercase text-[9px]">Quarter Final:</span>
                        <span className="font-semibold text-slate-800 dark:text-gray-300">
                          <PointsBadge value={item.points_quarterfinalist} />
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-gray-500 font-bold tracking-wider uppercase text-[9px]">R16/R32/R64:</span>
                        <div className="flex flex-col items-end gap-0.5">
                          {(item.points_r16 ?? 0) > 0 && (
                            <span className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                              R16: <span className="text-slate-800 dark:text-white">{(item.points_r16 ?? 0).toLocaleString()}</span>
                            </span>
                          )}
                          {(item.points_r32 ?? 0) > 0 && (
                            <span className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                              R32: <span className="text-slate-800 dark:text-white">{(item.points_r32 ?? 0).toLocaleString()}</span>
                            </span>
                          )}
                          {(item.points_r64 ?? 0) > 0 && (
                            <span className="text-[10px] text-slate-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                              R64: <span className="text-slate-800 dark:text-white">{(item.points_r64 ?? 0).toLocaleString()}</span>
                            </span>
                          )}
                          {!(item.points_r16 ?? 0) && !(item.points_r32 ?? 0) && !(item.points_r64 ?? 0) && (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mobile controls */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => onEdit(item)}
                        className="flex-1 py-2 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        className="flex-1 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 0 && (
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-gray-800/50">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-gray-400">
            Menampilkan <strong className="text-slate-900 dark:text-white">{Math.min((currentPage - 1) * pageSize + 1, totalItems)}</strong> sampai{" "}
            <strong className="text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, totalItems)}</strong> dari{" "}
            <strong className="text-slate-900 dark:text-white">{totalItems}</strong> tipe
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer bg-white dark:bg-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-9 h-9 text-xs rounded-lg font-bold border transition ${
                  currentPage === pageNum
                    ? "bg-brand-500 border-brand-500 text-white shadow-sm"
                    : "border-slate-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 bg-white dark:bg-gray-800"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer bg-white dark:bg-gray-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
