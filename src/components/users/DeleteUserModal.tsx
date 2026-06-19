"use client";

import React, { useState, useEffect } from "react";
import { User } from "@/app/admin/users/types";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteModalProps {
  isOpen: boolean;
  player: User | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function DeleteUserModal({ isOpen, player, onClose, onConfirm, isDeleting }: DeleteModalProps) {
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [errorText, setErrorText] = useState("");

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTypedConfirmation("");
      setErrorText("");
    }
  }, [isOpen]);

  if (!isOpen || !player) return null;

  const handleConfirm = () => {
    // Basic verification check using fullname or username
    const confirmText = player.username || player.fullname;
    if (typedConfirmation.trim().toLowerCase() !== confirmText.toLowerCase()) {
      setErrorText(`Ketik "${confirmText}" untuk konfirmasi penghapusan.`);
      return;
    }
    onConfirm();
  };

  const handleClose = () => {
    setTypedConfirmation("");
    setErrorText("");
    onClose();
  };

  const confirmText = player.username || player.fullname;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200">
      <div 
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-slate-200 dark:border-gray-800 max-w-md w-full overflow-hidden transform transition-all duration-200 scale-100 p-6 space-y-6"
      >
        {/* Warning Badge & Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-lg border border-red-200 dark:border-red-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Hapus Data Pengguna?
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
              Tindakan ini permanen dan tidak dapat dipulihkan dari basis data.
            </p>
          </div>
        </div>

        {/* User Stats Card */}
        <div className="p-4 bg-slate-50 dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700 space-y-2">
          <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase">
            <span className="text-slate-400">NAMA LENGKAP</span>
            <span className="text-slate-800 dark:text-white font-bold">{player.fullname}</span>
          </div>
          <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase">
            <span className="text-slate-400">USERNAME</span>
            <span className="text-slate-800 dark:text-white font-mono">{player.username ? `@${player.username}` : "-"}</span>
          </div>
          <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase">
            <span className="text-slate-400">PERAN / ROLE</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{player.role}</span>
          </div>
        </div>

        {/* Safe Confirmation Challenge */}
        <div className="space-y-2">
          <label htmlFor="confirm-input" className="block text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-gray-400">
            Ketik <strong className="text-red-600 dark:text-red-400 font-mono select-all font-bold">"{confirmText}"</strong> di bawah untuk mengonfirmasi:
          </label>
          <input
            id="confirm-input"
            type="text"
            placeholder="Ketik untuk menghapus"
            value={typedConfirmation}
            onChange={(e) => {
              setTypedConfirmation(e.target.value);
              if (errorText) setErrorText("");
            }}
            className={`w-full px-4 py-2 bg-slate-50 dark:bg-gray-800 border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 transition-all dark:text-white ${
              errorText 
                ? "border-red-400 focus:ring-red-200 dark:focus:ring-red-900/30" 
                : "border-slate-200 dark:border-gray-700 focus:ring-indigo-500/25 dark:focus:ring-indigo-500/40"
            }`}
          />
          {errorText && (
            <p className="text-[11px] text-red-600 dark:text-red-400 font-semibold flex items-center gap-1.5 mt-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {errorText}
            </p>
          )}
        </div>

        {/* Actions Button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-lg text-xs uppercase tracking-wider shadow-md hover:shadow-red-200 dark:hover:shadow-red-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              "Menghapus..."
            ) : (
              <><Trash2 className="w-4 h-4" /> Ya, Hapus</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
