import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle } from "lucide-react";
import { Player } from "@/app/admin/players/types";

interface DeletePlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  player: Player | null;
  isDeleting: boolean;
}

export default function DeletePlayerModal({
  isOpen,
  onClose,
  onConfirm,
  player,
  isDeleting,
}: DeletePlayerModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !player || !mounted) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 max-w-sm w-full mx-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-500/10">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Hapus Pemain
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tindakan ini tidak dapat dibatalkan
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
            Yakin ingin menghapus{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {player.full_name}
            </span>
            ?
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {isDeleting ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
