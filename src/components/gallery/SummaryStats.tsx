import React from 'react';
import { GalleryItem } from '@/app/admin/gallery/types';
import { Image, FolderOpen, Eye, EyeOff } from 'lucide-react';

interface SummaryStatsProps {
  items: GalleryItem[];
}

export default function SummaryStats({ items }: SummaryStatsProps) {
  const total = items.length;
  
  // Calculate unique categories dynamically
  const uniqueCategories = Array.from(new Set(items.map((img) => img.category).filter(Boolean))).length;
  
  // Calculate public and private counts
  const publicCount = items.filter((img) => img.is_published).length;
  const privateCount = total - publicCount;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Foto */}
      <div 
        id="stats-total-photos"
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default"
      >
        <div className="p-3 bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">
          <Image className="w-5 h-5 pointer-events-none" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">TOTAL FOTO</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{total}</p>
        </div>
      </div>

      {/* Total Kategori */}
      <div 
        id="stats-total-categories"
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default"
      >
        <div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
          <FolderOpen className="w-5 h-5 pointer-events-none" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">KATEGORI</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1.5 leading-none">{uniqueCategories}</p>
        </div>
      </div>

      {/* Akses Publik */}
      <div 
        id="stats-public-access"
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default"
      >
        <div className="p-3 bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
          <Eye className="w-5 h-5 pointer-events-none" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">PUBLIK</p>
          <div className="flex items-baseline gap-1 mt-1.5 leading-none">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{publicCount}</span>
            <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">/{total}</span>
          </div>
        </div>
      </div>

      {/* Akses Privat */}
      <div 
        id="stats-private-access"
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm flex items-center gap-4 cursor-default"
      >
        <div className="p-3 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
          <EyeOff className="w-5 h-5 pointer-events-none" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-none">DRAFT / PRIVAT</p>
          <div className="flex items-baseline gap-1 mt-1.5 leading-none">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">{privateCount}</span>
            <span className="text-xs text-slate-400 dark:text-gray-500 font-medium">/{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
