"use client";

import React, { useState, useEffect } from 'react';
import { GalleryItem, GalleryCategory } from '@/app/admin/gallery/types';
import { 
  X, Image as ImageIcon, User, ArrowLeft, Save, AlertCircle, CheckCircle, RefreshCw, Calendar, Files, Trash2 
} from 'lucide-react';
import { uploadStorageFile, deleteStorageFile } from '@/lib/utils/supabaseStorage';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'react-toastify';
import DatePicker from '@/components/form/DatePicker';

interface GalleryFormProps {
  itemToEdit?: GalleryItem;
  onClose: () => void;
  onSubmit: (dataArray: {
    title: string;
    description: string | null;
    image_url: string;
    category: GalleryCategory;
    uploaded_by: string | null;
    is_published: boolean;
    taken_at: string;
  }[]) => void;
}

interface SelectedFile {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
}

export default function GalleryForm({ itemToEdit, onClose, onSubmit }: GalleryFormProps) {
  const isEditMode = !!itemToEdit;

  // --- STATE FOR FIELDS ---
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GalleryCategory>('general');
  const [isPublished, setIsPublished] = useState(true);
  const [takenAt, setTakenAt] = useState('');

  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [supabase.auth]);

  // Validation States
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Sync state if editing
  useEffect(() => {
    if (itemToEdit) {
      setSelectedFiles([{
        id: itemToEdit.id,
        file: new File([], itemToEdit.title), // Dummy file for shape, size 0
        previewUrl: itemToEdit.image_url,
        title: itemToEdit.title
      }]);
      setDescription(itemToEdit.description || '');
      setCategory((itemToEdit.category as GalleryCategory) || 'general');
      setIsPublished(itemToEdit.is_published);
      if (itemToEdit.taken_at) {
        setTakenAt(itemToEdit.taken_at.split('T')[0]); // YYYY-MM-DD
      }
    }
  }, [itemToEdit]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newSelected = files.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        previewUrl: URL.createObjectURL(file),
        title: file.name.replace(/\.[^/.]+$/, "") // Set nama default ke nama file
      }));

      if (isEditMode) {
        setSelectedFiles(newSelected.slice(0, 1));
      } else {
        setSelectedFiles(prev => [...prev, ...newSelected]);
      }
      
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy.imageUrl;
        return copy;
      });
      
      // Reset input value so same files can be selected again if removed
      e.target.value = '';
    }
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles(prev => {
      const item = prev.find(f => f.id === id);
      if (item && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    setSelectedFiles(prev => prev.map(f => f.id === id ? { ...f, title: newTitle } : f));
  };

  const sanitizeInput = (val: string): string => {
    if (!val) return '';
    return val.replace(/<[^>]*>?/gm, '').trim();
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (selectedFiles.length === 0) {
      newErrors.imageUrl = 'Pilih minimal satu foto untuk diunggah.';
    } else {
      const missingTitle = selectedFiles.some(sf => !sanitizeInput(sf.title));
      if (missingTitle) {
        newErrors.imageUrl = 'Pastikan semua foto memiliki judul.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsUploading(true);
    try {
      const formDataArray = [];

      if (isEditMode) {
        const sf = selectedFiles[0];
        let finalImageUrl = sf.previewUrl;
        
        // If a new file was actually selected (size > 0), upload it
        if (sf.file.size > 0) {
          finalImageUrl = await uploadStorageFile(sf.file, "gallery");
          // delete old if different
          if (itemToEdit?.image_url && itemToEdit.image_url !== finalImageUrl) {
            await deleteStorageFile(itemToEdit.image_url, "gallery");
          }
        }

        formDataArray.push({
          title: sanitizeInput(sf.title),
          description: sanitizeInput(description) || null,
          image_url: finalImageUrl,
          category,
          uploaded_by: currentUserId || null,
          is_published: isPublished,
          taken_at: takenAt ? new Date(takenAt).toISOString() : new Date().toISOString()
        });
      } else {
        // CREATE MODE (Multiple Upload Support)
        for (let i = 0; i < selectedFiles.length; i++) {
          const sf = selectedFiles[i];
          const finalImageUrl = await uploadStorageFile(sf.file, "gallery");
          
          formDataArray.push({
            title: sanitizeInput(sf.title),
            description: sanitizeInput(description) || null,
            image_url: finalImageUrl,
            category,
            uploaded_by: currentUserId || null,
            is_published: isPublished,
            taken_at: takenAt ? new Date(takenAt).toISOString() : new Date().toISOString()
          });
        }
      }

      onSubmit(formDataArray);
    } catch (err: any) {
      toast.error(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-slate-200 dark:border-gray-800 max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-gray-800 flex items-center justify-between bg-slate-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg">
              {!isEditMode ? <Files className="w-5 h-5 pointer-events-none" /> : <ImageIcon className="w-5 h-5 pointer-events-none" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {isEditMode ? 'Edit Informasi Foto' : 'Unggah Foto'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-gray-700 rounded text-slate-500 dark:text-gray-400 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-4">
            
            {/* FILE SELECTION */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 uppercase">
                  Daftar Foto <span className="text-red-500">*</span>
                </label>
                {!isEditMode && (
                  <label className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded border border-indigo-200 dark:border-indigo-800 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition">
                    + Tambah Foto
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/webp" 
                      multiple={!isEditMode}
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                )}
                {isEditMode && (
                  <label className="px-3 py-1.5 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 text-xs font-bold rounded border border-slate-200 dark:border-gray-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-gray-700 transition">
                    Ganti Foto
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/webp" 
                      multiple={false}
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {selectedFiles.length === 0 ? (
                <div className="w-full h-32 rounded-lg border-2 border-dashed border-slate-300 dark:border-gray-700 flex flex-col items-center justify-center bg-slate-50 dark:bg-gray-800/50 text-slate-400 dark:text-gray-500">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Belum ada foto yang dipilih</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {selectedFiles.map((sf) => (
                    <div key={sf.id} className="flex items-start gap-3 p-3 border border-slate-200 dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-gray-800/50 shadow-sm relative group">
                      <div className="w-16 h-16 rounded overflow-hidden bg-slate-200 dark:bg-gray-900 shrink-0 border border-slate-200 dark:border-gray-700">
                        <img src={sf.previewUrl} alt={sf.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest mb-1.5">Judul</label>
                        <input 
                          type="text" 
                          value={sf.title}
                          onChange={(e) => handleTitleChange(sf.id, e.target.value)}
                          placeholder="Masukkan judul..."
                          className="w-full px-2 py-1.5 border border-slate-300 dark:border-gray-600 rounded text-xs focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-900 text-slate-800 dark:text-white transition-colors"
                        />
                      </div>
                      {!isEditMode && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveFile(sf.id)}
                          className="p-1.5 text-red-500 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded shadow-sm hover:bg-red-50 dark:hover:bg-red-900/30 transition cursor-pointer self-center"
                          title="Batal Unggah"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {errors.imageUrl && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.imageUrl}</p>}
            </div>

            {/* METADATA GLOBAL FOR ALL FILES */}
            <div className="bg-slate-50 dark:bg-gray-800/50 border border-slate-200 dark:border-gray-700 rounded-lg p-4 space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 uppercase mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GalleryCategory)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="tournament">Turnamen</option>
                    <option value="training">Latihan</option>
                    <option value="event">Event</option>
                    <option value="general">Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 uppercase mb-1">Status Akses</label>
                  <select
                    value={isPublished ? 'public' : 'private'}
                    onChange={(e) => setIsPublished(e.target.value === 'public')}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="public">🌐 Publik</option>
                    <option value="private">🔒 Draft (Privat)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 uppercase mb-1">Tanggal Diambil</label>
                  <div className="relative">
                    <DatePicker
                      id="taken_at"
                      value={takenAt}
                      onChange={(date) => setTakenAt(date)}
                      placeholder="Pilih tanggal"
                      maxDate="today"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-gray-300 uppercase mb-1 flex items-center justify-between">
                  <span>Deskripsi Singkat</span>
                  <span className="text-slate-400 dark:text-gray-500 font-normal">{description.length}/400</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white resize-none"
                  placeholder="Tulis deskripsi yang relevan untuk foto ini..."
                />
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-slate-200 dark:border-gray-800 flex justify-between gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-md text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-bold flex items-center gap-2 shadow-sm transition disabled:opacity-70 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {selectedFiles.length > 1 ? `Mengunggah ${selectedFiles.length} Foto...` : 'Menyimpan...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {selectedFiles.length > 1 ? `Simpan ${selectedFiles.length} Foto` : 'Simpan'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
