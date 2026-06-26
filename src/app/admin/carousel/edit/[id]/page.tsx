"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { uploadStorageFile, deleteStorageFile } from '@/lib/utils/supabaseStorage';
import { Save, X, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Link from 'next/link';
import Loader from '@/components/shared/Loader';

export default function EditCarouselPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '',
    order_index: 0,
    is_active: true,
    image_url: ''
  });
  
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchCarousel = async () => {
      const { data, error } = await supabase.from('carousels').select('*').eq('id', id).single();
      if (error || !data) {
        toast.error('Gagal memuat data banner.');
        router.push('/admin/carousel');
      } else {
        setFormData({
          title: data.title,
          order_index: data.order_index,
          is_active: data.is_active,
          image_url: data.image_url
        });
        
        let imgUrl = data.image_url;
        if (!imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
          imgUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery/${imgUrl}`;
        }
        setPreviewUrl(imgUrl);
      }
      setFetching(false);
    };

    fetchCarousel();
  }, [id, router, supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Judul tidak boleh kosong.');
      return;
    }
    if (formData.order_index < 0 || isNaN(formData.order_index)) {
      toast.error('Urutan tampil harus berupa angka 0 atau lebih besar.');
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl = formData.image_url;

      // Jika ada file baru yang dipilih, upload dan ganti
      if (file) {
        // Upload new file
        const uploadedPath = await uploadStorageFile(file, 'gallery');
        
        // Delete old file if it wasn't a placeholder/external link
        if (formData.image_url && formData.image_url.includes('/public/gallery/')) {
          await deleteStorageFile(formData.image_url, 'gallery');
        }
        
        finalImageUrl = uploadedPath;
      }

      // Update data in 'carousels' table
      const { error } = await supabase.from('carousels').update({
        title: formData.title,
        order_index: formData.order_index,
        is_active: formData.is_active,
        image_url: finalImageUrl,
        updated_at: new Date().toISOString()
      }).eq('id', id);

      if (error) throw error;

      toast.success('Perubahan banner berhasil disimpan.');
      router.push('/admin/carousel');
    } catch (err: any) {
      toast.error(`Gagal menyimpan banner: ${err.message}`);
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="flex justify-center items-center h-96"><Loader /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col gap-4">
        <PageBreadcrumb pageTitle="Edit Banner Beranda" />
      </div>

      <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 uppercase mb-2">Judul Banner <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-brand-500 dark:text-white"
                placeholder="Contoh: Pendaftaran Turnamen Prabu Cup 2026"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Order Index */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 uppercase mb-2">Urutan Tampil (Order)</label>
                <input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-brand-500 dark:text-white"
                  min="0"
                />
                <p className="text-[10px] text-slate-500 mt-1">Angka lebih kecil akan tampil lebih dulu.</p>
              </div>

              {/* Is Active */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 uppercase mb-2">Status Banner</label>
                <select
                  value={formData.is_active ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-brand-500 dark:text-white"
                >
                  <option value="true">Aktif (Tampilkan)</option>
                  <option value="false">Nonaktif (Sembunyikan)</option>
                </select>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 uppercase mb-2">Gambar Banner</label>
              
              <div className="flex flex-col gap-4">
                <div className="w-full h-48 md:h-64 border-2 border-dashed border-slate-300 dark:border-gray-700 rounded-xl overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-gray-800 relative group">
                  {previewUrl ? (
                    <>
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="text-white text-sm font-bold tracking-wide">Klik untuk mengubah gambar</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-slate-500 dark:text-gray-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <span className="text-sm font-medium">Upload Gambar (16:9 disarankan)</span>
                    </div>
                  )}
                  
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-500">Abaikan (jangan upload foto) jika tidak ingin mengubah gambar yang sudah ada.</p>
              </div>
            </div>

          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-gray-800 flex justify-between items-center">
            <Link
              href="/admin/carousel"
              className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-gray-700 text-slate-600 dark:text-gray-300 font-bold text-xs flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-gray-800 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
