"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, X, AlertTriangle, Loader2 } from "lucide-react";

interface DeleteMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  matchInfo?: string;
}

export default function DeleteMatchModal({ isOpen, onClose, onConfirm, isDeleting, matchInfo }: DeleteMatchModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={!isDeleting ? onClose : undefined}
      />
      <div 
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col transform transition-all border border-gray-100 dark:border-gray-800"
        role="dialog"
      >
        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Hapus Jadwal?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Apakah Anda yakin ingin menghapus jadwal pertandingan ini? 
              {matchInfo && <span className="block mt-1 font-semibold text-gray-700 dark:text-gray-300">({matchInfo})</span>}
              <br/>Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl border-t border-gray-100 dark:border-gray-800 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Hapus Jadwal
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
