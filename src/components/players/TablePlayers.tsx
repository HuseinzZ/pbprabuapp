import React from "react";
import Image from "next/image";
import { UserCheck, Link2, Link2Off, Edit2, Trash2, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Pagination from "../tables/Pagination";
import { Player, LEVEL_COLORS, FilterLevel, LEVEL_LABELS } from "@/app/admin/players/types";

interface TablePlayersProps {
  loading: boolean;
  players: Player[];
  filter: FilterLevel;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalPlayers: number;
  onPageChange: (page: number) => void;
  onEditPlayer: (player: Player) => void;
  onDeletePlayer: (player: Player) => void;
}

export default function TablePlayers({
  loading,
  players,
  filter,
  currentPage,
  pageSize,
  totalPages,
  totalPlayers,
  onPageChange,
  onEditPlayer,
  onDeletePlayer,
}: TablePlayersProps) {
  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <AlertCircle className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-sm font-medium">Tidak ada pemain ditemukan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="w-full">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  No.
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Pemain
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Level
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Kontak
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Poin Ranking
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
              {players.map((player, idx) => {
                const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                const lvlColors = player.level ? LEVEL_COLORS[player.level] : null;
                return (
                  <TableRow key={player.id} >
                    <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400 font-mono">
                      {globalIdx}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0 relative">
                          {player.avatar_url ? (
                            <Image
                              src={player.avatar_url}
                              alt={player.full_name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            player.full_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                            {player.full_name}
                          </p>
                          {player.nickname && (
                            <p className="text-xs text-gray-400">{player.nickname}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {lvlColors ? (
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${lvlColors.bg} ${lvlColors.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${lvlColors.dot}`} />
                          {player.level === "pratama" ? "Pratama" : "Utama"}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <p className="text-gray-700 dark:text-gray-300">
                        {player.email ?? "—"}
                      </p>
                      <p className="text-xs text-gray-400">{player.phone ?? ""}</p>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {player.ranking_points.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">pts</span>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${player.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${player.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                        {player.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-3 text-gray-500 text-end text-theme-sm dark:text-gray-400">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditPlayer(player)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                          title="Edit Pemain"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeletePlayer(player)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="Hapus Pemain"
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

      {/* Footer with Pagination */}
      <div className="px-5 py-4 border-t border-gray-100 dark:border-white/[0.05] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalPlayers)} dari {totalPlayers} pemain
          {filter !== "all" && ` · Filter: ${LEVEL_LABELS[filter]}`}
        </div>

        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={onPageChange} 
        />
      </div>
    </div>
  );
}
