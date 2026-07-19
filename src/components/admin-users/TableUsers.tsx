import React from "react";
import Image from "next/image";
import { Edit, Trash2, ShieldAlert, Calendar } from "lucide-react";
import { User, FilterLevel, LEVEL_LABELS } from "@/app/admin/users/types";
import Pagination from "../tables/Pagination";

interface TableUsersProps {
  loading: boolean;
  users: User[];
  filter: FilterLevel;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalUsers: number;
  onPageChange: (page: number) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onToggleStatus?: (user: User) => void;
}

export default function TableUsers({
  loading,
  users,
  filter,
  currentPage,
  pageSize,
  totalPages,
  totalUsers,
  onPageChange,
  onEditUser,
  onDeleteUser,
  onToggleStatus,
}: TableUsersProps) {
  
  // Helpers
  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length === 0 || parts[0] === "") return "?";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getRoleBadgeStyle = (role: string) => {
    if (role === "admin") return "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20";
    return "bg-slate-50 text-slate-600 border border-slate-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
  };

  const formatDateString = (isoString?: string | null) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg shadow-sm flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg shadow-sm flex flex-col">
      <div className="flex-1 w-full overflow-x-auto">
        {users.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-500 rounded-2xl">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Pengguna tidak ditemukan</h3>
              <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
                Tidak ada data user yang sesuai dengan filter/pencarian Anda.
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
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">PENGGUNA</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">KONTAK</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">PERAN & LEVEL</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">STATUS</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">POIN</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-gray-800">
                {users.map((user, index) => {
                  const avatarClass = user.role === "admin" 
                    ? "from-indigo-500 to-purple-600"
                    : "from-brand-500 to-brand-600";

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition duration-150"
                    >
                      {/* No. */}
                      <td className="p-4 whitespace-nowrap text-xs font-medium text-slate-500 dark:text-gray-400 text-center">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* Profile User block */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${avatarClass} text-white font-bold flex items-center justify-center rounded shadow-sm ring-1 ring-slate-200 dark:ring-gray-700 select-none relative overflow-hidden shrink-0`}>
                            {user.avatar_url ? (
                              <Image src={user.avatar_url} alt={user.fullname} fill className="object-cover" unoptimized />
                            ) : (
                              getInitials(user.fullname)
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                              {user.fullname}
                              {user.gender === "male" ? (
                                <span className="inline-flex text-[10px] font-medium text-blue-500">♂</span>
                              ) : user.gender === "female" ? (
                                <span className="inline-flex text-[10px] font-medium text-pink-500">♀</span>
                              ) : null}
                            </div>
                            <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                              @{user.username || "—"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact block */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="text-xs text-slate-800 dark:text-gray-300 font-medium">
                          {user.email || "—"}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">{user.address ? `${user.address.substring(0, 20)}...` : "—"}</div>
                      </td>

                      {/* Role & Level Badge */}
                      <td className="p-4 whitespace-nowrap space-y-1">
                        <div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeStyle(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                        {user.level && (
                          <div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20">
                              {user.level}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status toggle */}
                      <td className="p-4 whitespace-nowrap">
                        <button
                          onClick={() => onToggleStatus && onToggleStatus(user)}
                          disabled={!onToggleStatus}
                          title={onToggleStatus ? "Klik untuk mengubah status" : ""}
                          className={`group/toggle flex items-center gap-2 text-left bg-transparent border-0 outline-none ${onToggleStatus ? "cursor-pointer" : "cursor-default"}`}
                        >
                          <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 relative shrink-0 ${
                            user.is_active ? "bg-emerald-500" : "bg-slate-300 dark:bg-gray-600"
                          }`}>
                            <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200 shadow-sm ${
                              user.is_active ? "translate-x-3.5" : "translate-x-0"
                            }`} />
                          </div>
                          <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                            user.is_active ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400 dark:text-gray-500"
                          }`}>
                            {user.is_active ? "Aktif" : "Nonaktif"}
                          </span>
                        </button>
                      </td>

                      {/* Poin & Date */}
                      <td className="p-4 whitespace-nowrap text-xs">
                        <div className="font-bold text-slate-800 dark:text-white">
                          {(user.ranking_points ?? 0).toLocaleString()} pts
                        </div>
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] font-medium text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatDateString(user.joined_at || user.created_at)}
                        </div>
                      </td>

                      {/* Controls block */}
                      <td className="p-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onEditUser(user)}
                            title="Edit data pengguna"
                            className="p-1.5 border border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 rounded hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition duration-150 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteUser(user)}
                            title="Hapus akun pengguna"
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
              {users.map((user) => {
                const avatarClass = user.role === "admin" 
                  ? "from-indigo-500 to-purple-600"
                  : "from-brand-500 to-brand-600";

                return (
                  <div 
                    key={user.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 bg-gradient-to-br ${avatarClass} text-white font-bold flex items-center justify-center rounded-lg relative overflow-hidden`}>
                          {user.avatar_url ? (
                            <Image src={user.avatar_url} alt={user.fullname} fill className="object-cover" unoptimized />
                          ) : (
                            getInitials(user.fullname)
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{user.fullname}</h4>
                          <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-semibold">
                            @{user.username || "—"}
                          </span>
                        </div>
                      </div>

                      {/* Status badge */}
                      <button
                        onClick={() => onToggleStatus && onToggleStatus(user)}
                        disabled={!onToggleStatus}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border transition ${
                          user.is_active 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400" 
                            : "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400"
                        }`}
                      >
                        {user.is_active ? "Aktif" : "Nonaktif"}
                      </button>
                    </div>

                    <div className="border-t border-b border-slate-100 dark:border-gray-700 py-3 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-gray-500 font-bold tracking-wider uppercase text-[9px]">Email:</span>
                        <span className="font-semibold text-slate-800 dark:text-gray-300">
                          {user.email || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-gray-500 font-bold tracking-wider uppercase text-[9px]">Poin:</span>
                        <span className="font-mono text-slate-800 dark:text-gray-300">{(user.ranking_points ?? 0).toLocaleString()} pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 dark:text-gray-500 font-bold tracking-wider uppercase text-[9px]">Peran:</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getRoleBadgeStyle(user.role)}`}>
                          {user.role}
                        </span>
                      </div>
                      {user.level && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 dark:text-gray-500 font-bold tracking-wider uppercase text-[9px]">Level:</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20">
                            {user.level}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Mobile controls */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => onEditUser(user)}
                        className="flex-1 py-2 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-gray-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteUser(user)}
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
          <span className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
            Menampilkan <strong className="text-slate-900 dark:text-white">{Math.min((currentPage - 1) * pageSize + 1, totalUsers)}</strong> -{" "}
            <strong className="text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, totalUsers)}</strong> dari{" "}
            <strong className="text-slate-900 dark:text-white">{totalUsers}</strong> pengguna
          </span>

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
