import React from "react";
import { AlertCircle, Trophy } from "lucide-react";
import { Tournament, STATUS_CONFIG } from "@/app/admin/tournaments/types";
import Loader from "@/components/shared/Loader";

interface DeleteTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tournament: Tournament | null;
  isDeleting: boolean;
}

export default function DeleteTournamentModal({
  isOpen,
  onClose,
  onConfirm,
  tournament,
  isDeleting,
}: DeleteTournamentModalProps) {
  if (!isOpen || !tournament) return null;

  const sc = STATUS_CONFIG[tournament.status];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 max-w-sm w-full mx-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-500/10">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Hapus Turnamen
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tindakan ini tidak dapat dibatalkan
              </p>
            </div>
          </div>

          {/* Tournament info card */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shrink-0">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {tournament.name}
              </p>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${sc.bg} ${sc.text}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                {sc.label}
              </span>
            </div>
          </div>

          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2 mb-5">
            ⚠️ Semua data terkait (peserta, pertandingan, klasemen) akan ikut terhapus.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              id="btn-cancel-delete"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Batal
            </button>
            <button
              id="btn-confirm-delete"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
