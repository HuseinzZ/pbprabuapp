"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";

export type CarouselItemBase = {
  id: string;
  title: string;
  image_url: string;
};

interface DeleteModalProps {
  isOpen: boolean;
  carousel: CarouselItemBase | null;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function DeleteCarouselModal({ isOpen, carousel, onClose, onConfirm, isDeleting }: DeleteModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !carousel || !mounted) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleClose = () => {
    onClose();
  };

  const confirmText = carousel.title;
  
  let imgUrl = carousel.image_url;
  if (!imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
    imgUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery/${imgUrl}`;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-200">
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
              Hapus Banner Beranda?
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
              Tindakan ini permanen dan gambar akan dihapus dari penyimpanan.
            </p>
          </div>
        </div>

        {/* Carousel Preview */}
        <div className="p-4 bg-slate-50 dark:bg-gray-800/50 rounded-lg border border-slate-200 dark:border-gray-700 space-y-3">
          <img src={imgUrl} alt={carousel.title} className="w-full h-32 object-cover rounded shadow-sm border border-slate-200 dark:border-gray-700" />
          <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase items-center">
            <span className="text-slate-400">JUDUL BANNER</span>
            <span className="text-slate-800 dark:text-white font-bold max-w-[200px] truncate text-right">{carousel.title}</span>
          </div>
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
    </div>,
    document.body
  );
}
