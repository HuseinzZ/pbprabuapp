"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import Loader from '@/components/shared/Loader';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Link from 'next/link';
import { deleteStorageFile } from '@/lib/utils/supabaseStorage';

export type CarouselItem = {
  id: string;
  title: string;
  image_url: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
};

export default function CarouselDashboard() {
  const supabase = createClient();
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchCarousels = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("carousels")
      .select("*")
      .order("order_index", { ascending: true });
      
    if (error) {
      toast.error("Gagal memuat data banner.");
    } else {
      setItems((data as CarouselItem[]) ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCarousels();
  }, [fetchCarousels]);

  const handleDelete = async (id: string, title: string, imageUrl: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus banner "${title}"?`)) return;

    if (imageUrl && imageUrl.includes('/public/gallery/')) {
      await deleteStorageFile(imageUrl, "gallery");
    }
    
    const { error } = await supabase.from('carousels').delete().eq('id', id);
    if (error) {
      toast.error(`Gagal menghapus banner: ${error.message}`);
    } else {
      toast.success('Banner berhasil dihapus.');
      fetchCarousels();
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('carousels').update({ is_active: !currentStatus }).eq('id', id);
    if (error) {
      toast.error(`Gagal mengubah status: ${error.message}`);
    } else {
      toast.success('Status banner diperbarui.');
      fetchCarousels();
    }
  };

  if (loading && items.length === 0) {
    return <div className="flex justify-center items-center h-96"><Loader /></div>;
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb pageTitle="Banner Beranda" />
        <div className="flex items-center justify-end">
          <Link
            href="/admin/carousel/add"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Tambah Banner
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-lg shadow-sm flex flex-col">
        <div className="flex-1 w-full overflow-x-auto">
          {items.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-500 rounded-2xl">
                <ImageIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Belum Ada Banner</h3>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 max-w-sm mx-auto">
                  Tambahkan banner untuk menampilkannya di halaman beranda.
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-800/50 border-b border-slate-200 dark:border-gray-800">
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none w-10 text-center">Urutan</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">Gambar</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none">Judul</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none text-center">Status</th>
                  <th className="p-4 text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest select-none text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-gray-800">
                {paginatedItems.map((item) => {
                  let imgUrl = item.image_url;
                  if (!imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
                    imgUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery/${imgUrl}`;
                  }
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-gray-800/50 transition duration-150">
                      <td className="p-4 whitespace-nowrap text-xs font-medium text-slate-500 dark:text-gray-400 text-center">
                        {item.order_index}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <img src={imgUrl} alt={item.title} className="w-32 h-16 object-cover rounded ring-1 ring-slate-200 dark:ring-gray-700 shadow-sm" />
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-800 dark:text-white">
                          {item.title}
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleToggleActive(item.id, item.is_active)}
                            title="Klik untuk mengubah status"
                            className="group/toggle flex items-center gap-2 text-left bg-transparent border-0 outline-none cursor-pointer"
                          >
                            <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 relative shrink-0 ${
                              item.is_active ? "bg-emerald-500" : "bg-slate-300 dark:bg-gray-600"
                            }`}>
                              <div className={`w-3.5 h-3.5 bg-white rounded-full transition-transform duration-200 shadow-sm ${
                                item.is_active ? "translate-x-3.5" : "translate-x-0"
                              }`} />
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                              item.is_active ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400 dark:text-gray-500"
                            }`}>
                              {item.is_active ? "Aktif" : "Nonaktif"}
                            </span>
                          </button>
                        </div>
                      </td>
                      <td className="p-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/carousel/edit/${item.id}`}
                            title="Edit banner"
                            className="p-1.5 border border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600 rounded hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-400 transition duration-150 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(item.id, item.title, item.image_url)}
                            title="Hapus banner"
                            className="p-1.5 border border-slate-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-800 rounded hover:bg-slate-50 dark:hover:bg-gray-800 text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition duration-150 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 0 && items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 dark:bg-gray-800/50">
            <span className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
              Menampilkan <strong className="text-slate-900 dark:text-white">{Math.min((currentPage - 1) * pageSize + 1, items.length)}</strong> -{" "}
              <strong className="text-slate-900 dark:text-white">{Math.min(currentPage * pageSize, items.length)}</strong> dari{" "}
              <strong className="text-slate-900 dark:text-white">{items.length}</strong> banner
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer bg-white dark:bg-gray-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`min-w-9 h-9 text-xs rounded-lg font-bold border transition cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-brand-500 border-brand-500 text-white shadow-sm"
                      : "border-slate-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 text-slate-700 dark:text-gray-300 bg-white dark:bg-gray-800"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer bg-white dark:bg-gray-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
