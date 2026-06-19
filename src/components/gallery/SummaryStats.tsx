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
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm transition-all duration-250 flex items-center gap-4 group cursor-default"
      >
        <div className="p-3 bg-slate-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-250">
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
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-sm transition-all duration-250 flex items-center gap-4 group cursor-default"
      >
        <div className="p-3 bg-slate-100 dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-250">
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
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 hover:border-amber-300 dark:hover:border-amber-700 shadow-sm transition-all duration-250 flex items-center gap-4 group cursor-default"
      >
        <div className="p-3 bg-slate-100 dark:bg-gray-800 text-amber-600 dark:text-amber-400 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-all duration-250">
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
        className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 hover:border-red-300 dark:hover:border-red-700 shadow-sm transition-all duration-250 flex items-center gap-4 group cursor-default"
      >
        <div className="p-3 bg-slate-100 dark:bg-gray-800 text-red-600 dark:text-red-400 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-all duration-250">
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
