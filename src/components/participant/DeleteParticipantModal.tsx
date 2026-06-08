import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X, Trash2 } from "lucide-react";
import { Participant } from "@/app/admin/participant/types";

interface DeleteParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  participant: Participant | null;
  isDeleting: boolean;
}

export default function DeleteParticipantModal({
  isOpen,
  onClose,
  onConfirm,
  participant,
  isDeleting,
}: DeleteParticipantModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !participant || !mounted) return null;

  const playerName = participant.players?.full_name ?? "Peserta ini";
  const tournamentName = participant.tournaments?.name ?? "";

  return createPortal(
    <div className="fixed inset-0 z-[50] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">
              Hapus Peserta
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Yakin ingin menghapus{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {playerName}
            </span>{" "}
            dari turnamen{" "}
            {tournamentName && (
              <span className="font-semibold text-gray-900 dark:text-white">
                &ldquo;{tournamentName}&rdquo;
              </span>
            )}
            ?
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2 mt-4">
            ⚠️ Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {isDeleting ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
