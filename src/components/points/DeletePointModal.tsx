import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertCircle } from "lucide-react";
import { Point } from "@/app/admin/points/types";
import Loader from "@/components/shared/Loader";

interface DeletePointModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: Point | null;
  isDeleting: boolean;
}

export default function DeletePointModal({
  isOpen,
  onClose,
  onConfirm,
  item,
  isDeleting,
}: DeletePointModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !item || !mounted) return null;

  return createPortal(
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
                Hapus Tipe Turnamen
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tindakan ini tidak dapat dibatalkan
              </p>
            </div>
          </div>

          {/* Body */}
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            Yakin ingin menghapus tipe turnamen{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              &ldquo;{item.name}&rdquo;
            </span>
            ?
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg px-3 py-2 mb-5">
            ⚠️ Menghapus tipe ini dapat berdampak pada turnamen yang menggunakannya.
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
    </>,
    document.body
  );
}
