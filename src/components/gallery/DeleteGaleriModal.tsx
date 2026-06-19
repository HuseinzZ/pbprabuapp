import React from 'react';
import { GalleryItem } from '@/app/admin/gallery/types';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteModalProps {
  item: GalleryItem;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteGaleriModal({ item, onConfirm, onClose }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-slate-200 dark:border-gray-800 max-w-md w-full overflow-hidden scale-in-95 animate-in duration-200">
        <div className="p-5 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
          </div>
          
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Hapus Foto Galeri?</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
            Anda yakin ingin menghapus foto <span className="font-semibold text-slate-700 dark:text-gray-300">"{item.title}"</span> secara permanen? Tindakan ini tidak dapat dibatalkan.
          </p>

          <div className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-3 rounded text-left mb-6 flex gap-3">
            <div className="w-16 h-16 rounded overflow-hidden bg-slate-200 dark:bg-gray-900 shrink-0 border border-slate-200 dark:border-gray-700">
               <img src={item.image_url} alt="thumbnail" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
               <span className="text-xs font-bold text-slate-700 dark:text-gray-200 truncate block">{item.title}</span>
               <span className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">Kategori: {item.category}</span>
            </div>
          </div>
          
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 px-4 bg-red-600 rounded text-sm font-bold text-white hover:bg-red-700 transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Ya, Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
