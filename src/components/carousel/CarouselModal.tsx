"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-toastify';
import { uploadStorageFile, deleteStorageFile } from '@/lib/utils/supabaseStorage';
import { Save, X, Image as ImageIcon } from 'lucide-react';
import { Modal } from '@/components/ui/modal/modal';

interface CarouselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  carouselToEdit?: any | null; // Pass null for add mode, pass object for edit mode
}

export default function CarouselModal({
  isOpen,
  onClose,
  onSuccess,
  carouselToEdit
}: CarouselModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    order_index: 0,
    is_active: true,
    image_url: ''
  });
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Initialize data
  useEffect(() => {
    if (isOpen) {
      if (carouselToEdit) {
        setFormData({
          title: carouselToEdit.title,
          order_index: carouselToEdit.order_index,
          is_active: carouselToEdit.is_active,
          image_url: carouselToEdit.image_url
        });
        
        let imgUrl = carouselToEdit.image_url;
        if (!imgUrl.startsWith('http') && !imgUrl.startsWith('/')) {
          imgUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery/${imgUrl}`;
        }
        setPreviewUrl(imgUrl);
        setFile(null); // Reset file if switching from add to edit
      } else {
        // Mode Add - Reset form
        setFormData({
          title: '',
          order_index: 1, // Akan ditimpa jika ada query
          is_active: true,
          image_url: ''
        });
        setFile(null);
        setPreviewUrl(null);
        
        // Ambil order_index tertinggi
        const fetchMaxOrder = async () => {
          const { data, error } = await supabase
            .from('carousels')
            .select('order_index')
            .order('order_index', { ascending: false })
            .limit(1);

          if (!error && data && data.length > 0) {
            setFormData(prev => ({
              ...prev,
              order_index: (data[0].order_index || 0) + 1
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              order_index: 1
            }));
          }
        };
        fetchMaxOrder();
      }
    }
  }, [isOpen, carouselToEdit, supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carouselToEdit && !file) {
      toast.error('Pilih gambar terlebih dahulu.');
      return;
    }
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

      if (file) {
        // Upload new file
        const uploadedPath = await uploadStorageFile(file, 'gallery');
        
        // Delete old file if editing and it wasn't a placeholder/external link
        if (carouselToEdit && formData.image_url && formData.image_url.includes('/public/gallery/')) {
          await deleteStorageFile(formData.image_url, 'gallery');
        }
        
        finalImageUrl = uploadedPath;
      }

      if (carouselToEdit) {
        // Edit Mode
        const { error } = await supabase.from('carousels').update({
          title: formData.title,
          order_index: formData.order_index,
          is_active: formData.is_active,
          image_url: finalImageUrl,
          updated_at: new Date().toISOString()
        }).eq('id', carouselToEdit.id);

        if (error) throw error;
        toast.success('Perubahan banner berhasil disimpan.');
      } else {
        // Add Mode
        const { error } = await supabase.from('carousels').insert({
          title: formData.title,
          order_index: formData.order_index,
          is_active: formData.is_active,
          image_url: finalImageUrl
        });

        if (error) throw error;
        toast.success('Banner berhasil ditambahkan.');
      }
      
      onSuccess();
    } catch (err: any) {
      toast.error(`Gagal menyimpan banner: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-slate-200 dark:border-gray-800 max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between bg-slate-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-600 text-white rounded-lg">
              <ImageIcon className="w-5 h-5 pointer-events-none" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {carouselToEdit ? 'Edit Informasi Banner' : 'Unggah Banner'}
              </h2>
            </div>
          </div>
          <button onClick={() => !loading && onClose()} className="p-1 hover:bg-slate-200 dark:hover:bg-gray-700 rounded text-slate-500 dark:text-gray-400 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            
            {/* FILE SELECTION */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 uppercase">
                  Gambar Banner {(!carouselToEdit) && <span className="text-red-500">*</span>}
                </label>
                {!carouselToEdit && (
                  <label className="px-3 py-1.5 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 text-xs font-bold rounded border border-brand-200 dark:border-brand-800 cursor-pointer hover:bg-brand-100 dark:hover:bg-brand-900/50 transition">
                    + Tambah Gambar
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/webp" 
                      onChange={handleFileChange}
                      disabled={loading}
                      className="hidden"
                    />
                  </label>
                )}
                {carouselToEdit && (
                  <label className="px-3 py-1.5 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 text-xs font-bold rounded border border-slate-200 dark:border-gray-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-gray-700 transition">
                    Ganti Gambar
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/webp" 
                      onChange={handleFileChange}
                      disabled={loading}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {!previewUrl ? (
                <div className="w-full h-32 rounded-lg border-2 border-dashed border-slate-300 dark:border-gray-700 flex flex-col items-center justify-center bg-slate-50 dark:bg-gray-800/50 text-slate-400 dark:text-gray-500">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Belum ada gambar yang dipilih</p>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 border border-slate-200 dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-gray-800/50 shadow-sm relative group">
                  <div className="w-32 h-20 md:w-48 md:h-28 rounded overflow-hidden bg-slate-200 dark:bg-gray-900 shrink-0 border border-slate-200 dark:border-gray-700">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 mt-2">Pratinjau gambar banner yang akan diunggah.</p>
                  </div>
                </div>
              )}
            </div>

            {/* METADATA */}
            <div className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-lg p-4 space-y-4 mt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 uppercase mb-1">Judul Banner <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:text-white transition-colors"
                  placeholder="Contoh: Pendaftaran Turnamen Prabu Cup 2026"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 uppercase mb-1">Status Akses</label>
                  <select
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="true">🌐 Publik (Tampilkan)</option>
                    <option value="false">🔒 Privat (Sembunyikan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 uppercase mb-1">Urutan Tampil (Order)</label>
                  <input
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:text-white"
                    min="0"
                  />
                  <p className="text-[9px] text-slate-500 mt-1">Angka lebih kecil tampil di awal.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-200 dark:border-gray-800 flex justify-between gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-md text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md text-sm font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-70 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
