"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  GalleryItem, GalleryCategory, GalleryActivityLog, GalleryFilters 
} from './types';
import SummaryStats from '@/components/gallery/SummaryStats';
import GalleryForm from '@/components/gallery/GalleryForm';
import DeleteGaleriModal from '@/components/gallery/DeleteGaleriModal';
import ActivityLogs from '@/components/gallery/ActivityLogs';
import { deleteStorageFile } from '@/lib/utils/supabaseStorage';
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ExportButtons from "@/components/common/ExportButtons";
import { toast } from 'react-toastify';
import { 
  motion, AnimatePresence 
} from 'motion/react';
import { 
  Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, 
  Download, SlidersHorizontal, AlertCircle, X, 
  BadgeCheck, FileSpreadsheet, Calendar, User, Eye, EyeOff, Compass,
  ExternalLink, Image as ImageIcon
} from 'lucide-react';
import Loader from '@/components/shared/Loader';

export default function GalleryDashboard() {
  const supabase = createClient();
  
  // --- STATE ---
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<GalleryActivityLog[]>([]);
  
  // Modals & form control state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<GalleryItem | undefined>(undefined);
  const [selectedItemForDelete, setSelectedItemForDelete] = useState<GalleryItem | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Lightbox View State
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  // Filters & sorting state
  const [filters, setFilters] = useState<GalleryFilters>({
    query: '',
    category: '',
    status: '',
    sortBy: 'date_desc' 
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // --- FETCH DATA FROM SUPABASE ---
  const fetchGallery = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("gallery")
      .select("*, profile(fullname)")
      .order("created_at", { ascending: false });
      
    if (error) {
      toast.error("Gagal memuat data galeri.");
    } else {
      setItems((data as GalleryItem[]) ?? []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchGallery();
    
    // Load logs from local storage
    const storedLogs = localStorage.getItem('manajemen_galeri_logs');
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch (err) {
        setLogs([]);
      }
    }
  }, [fetchGallery]);

  // --- LOGGING ---
  const addLog = (actionText: string, type: GalleryActivityLog['type']) => {
    const newLog: GalleryActivityLog = {
      id: `log-${Date.now()}`,
      action: actionText,
      timestamp: new Date().toISOString(),
      type
    };
    const updatedLogs = [...logs, newLog].slice(-50); // Keep last 50
    setLogs(updatedLogs);
    localStorage.setItem('manajemen_galeri_logs', JSON.stringify(updatedLogs));
  };

  const handleClearLogs = () => {
    setLogs([]);
    localStorage.removeItem('manajemen_galeri_logs');
    toast.success('Log aktivitas galeri telah dibersihkan.');
  };

  // --- GALLERY MUTATIONS (SUPABASE) ---

  const handleFormSubmit = async (formDataArray: {
    title: string;
    description: string | null;
    image_url: string;
    category: GalleryCategory;
    uploaded_by: string | null;
    is_published: boolean;
    taken_at: string;
  }[]) => {
    if (selectedItemForEdit) {
      // EDIT MODE
      const formData = formDataArray[0];
      const { error } = await supabase
        .from('gallery')
        .update({
          title: formData.title,
          description: formData.description,
          image_url: formData.image_url,
          category: formData.category,
          uploaded_by: formData.uploaded_by,
          is_published: formData.is_published,
          taken_at: formData.taken_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedItemForEdit.id);

      if (error) {
        toast.error(`Gagal menyimpan perubahan: ${error.message}`);
        return;
      }

      toast.success(`Perubahan metadata "${formData.title}" berhasil disimpan.`);
      addLog(`Metadata foto "${formData.title}" diperbarui.`, 'update');
      
      // Update local state to avoid refetch if possible, or just refetch
      await fetchGallery();
      
      // Sync Lightbox if currently open
      if (lightboxItem && lightboxItem.id === selectedItemForEdit.id) {
        setLightboxItem({
          ...lightboxItem,
          ...formData
        });
      }
    } else {
      // CREATE MODE
      const { error } = await supabase
        .from('gallery')
        .insert(formDataArray);

      if (error) {
        toast.error(`Gagal menambah foto: ${error.message}`);
        return;
      }

      toast.success(`${formDataArray.length} Foto berhasil diunggah.`);
      addLog(`${formDataArray.length} karya foto baru diunggah.`, 'create');
      await fetchGallery();
    }

    setIsFormOpen(false);
    setSelectedItemForEdit(undefined);
  };

  const handleToggleAccess = async (id: string, currentStatus: boolean, title: string) => {
    const newStatus = !currentStatus;
    
    // Optimistic UI update
    setItems(items.map(img => img.id === id ? { ...img, is_published: newStatus } : img));
    
    const { error } = await supabase
      .from('gallery')
      .update({ is_published: newStatus })
      .eq('id', id);

    if (error) {
      // Revert if error
      setItems(items.map(img => img.id === id ? { ...img, is_published: currentStatus } : img));
      toast.error('Gagal mengubah status akses.');
      return;
    }

    const accessText = newStatus ? 'Publik' : 'Privat';
    toast.success(`Akses "${title}" diubah menjadi ${accessText}.`);
    addLog(`Status akses foto "${title}" diubah menjadi ${accessText}.`, 'access_toggle');
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItemForDelete) return;

    // 1. Hapus file dari Storage bucket "gallery"
    if (selectedItemForDelete.image_url) {
      await deleteStorageFile(selectedItemForDelete.image_url, "gallery");
    }

    // 2. Hapus data dari database
    const { error } = await supabase
      .from('gallery')
      .delete()
      .eq('id', selectedItemForDelete.id);

    if (error) {
      toast.error(`Gagal menghapus foto: ${error.message}`);
      return;
    }

    toast.success(`Foto "${selectedItemForDelete.title}" dihapus permanen.`);
    addLog(`Foto "${selectedItemForDelete.title}" dihapus.`, 'delete');
    
    setItems(items.filter(img => img.id !== selectedItemForDelete.id));

    if (lightboxItem && lightboxItem.id === selectedItemForDelete.id) {
      setLightboxItem(null);
    }

    setIsDeleteOpen(false);
    setSelectedItemForDelete(null);
  };

  // --- FILTERS & SORTING ENGINE ---
  const handleFilterChange = (updates: Partial<GalleryFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setCurrentPage(1); 
  };

  const handleClearFilters = () => {
    setFilters({
      query: '',
      category: '',
      status: '',
      sortBy: 'date_desc'
    });
    setCurrentPage(1);
    toast.info('Seluruh filter berhasil dihapus!');
  };

  const processedItems = useMemo(() => {
    let result = [...items];

    const q = filters.query.trim().toLowerCase();
    if (q) {
      result = result.filter((img) => {
        const matchesTitle = img.title.toLowerCase().includes(q);
        const matchesDesc = (img.description || '').toLowerCase().includes(q);
        const uploaderName = img.profile?.fullname || img.uploaded_by || '';
        const matchesCreator = uploaderName.toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesCreator;
      });
    }

    if (filters.category) {
      result = result.filter((img) => img.category === filters.category);
    }

    if (filters.status !== '') {
      const isPub = filters.status === 'public';
      result = result.filter((img) => img.is_published === isPub);
    }

    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'title_asc':
          return a.title.localeCompare(b.title, 'id');
        case 'title_desc':
          return b.title.localeCompare(a.title, 'id');
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date_desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [items, filters]);

  // --- PAGINATION ---
  const totalPages = Math.ceil(processedItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return processedItems.slice(start, start + itemsPerPage);
  }, [processedItems, currentPage]);

  const handlePageChange = (targetPage: number) => {
    if (targetPage >= 1 && targetPage <= totalPages) {
      setCurrentPage(targetPage);
      document.getElementById('main-app-header')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- DATA EXPORT ---
  const handleExportData = (type: 'json' | 'csv') => {
    if (items.length === 0) {
      toast.error('Gagal ekspor: Basis data galeri kosong.');
      return;
    }

    try {
      let content = '';
      let filename = `backup_galeri_${Date.now()}`;
      let contentType = 'text/plain';

      if (type === 'json') {
        content = JSON.stringify(items, null, 2);
        filename += '.json';
        contentType = 'application/json';
      } else {
        const headers = ['ID', 'Judul', 'Deskripsi', 'Kategori', 'Pengunggah', 'Akses', 'Tanggal Upload'];
        const rows = items.map((img) => [
          img.id,
          `"${img.title.replace(/"/g, '""')}"`,
          `"${(img.description || '').replace(/"/g, '""')}"`,
          img.category,
          `"${(img.profile?.fullname || img.uploaded_by || '').replace(/"/g, '""')}"`,
          img.is_published ? 'Publik' : 'Privat',
          img.created_at
        ]);
        
        content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        filename += '.csv';
        contentType = 'text/csv';
      }

      const blob = new Blob([content], { type: `${contentType};charset=utf-8;` });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Berhasil mengekspor data foto (${type.toUpperCase()}).`);
      addLog(`Data galeri diunduh dalam format ${type.toUpperCase()}.`, 'update');
    } catch (err) {
      toast.error('Terjadi kesalahan selama proses ekspor data.');
    }
  };

  const formatDateString = (isoString: string) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return 'Tanggal tidak valid';
    }
  };

  const handleLightboxPrev = () => {
    if (!lightboxItem) return;
    const currentIndex = processedItems.findIndex(i => i.id === lighthouseItemIndexId);
    if (currentIndex > 0) {
      setLightboxItem(processedItems[currentIndex - 1]);
    } else {
      setLightboxItem(processedItems[processedItems.length - 1]);
    }
  };

  const handleLightboxNext = () => {
    if (!lightboxItem) return;
    const currentIndex = processedItems.findIndex(i => i.id === lighthouseItemIndexId);
    if (currentIndex < processedItems.length - 1) {
      setLightboxItem(processedItems[currentIndex + 1]);
    } else {
      setLightboxItem(processedItems[0]);
    }
  };

  const lighthouseItemIndexId = lightboxItem?.id;

  if (loading && items.length === 0) {
    return <div className="flex justify-center items-center h-96"><Loader /></div>;
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col gap-4">
        <PageBreadcrumb pageTitle="Galeri Foto" />
        <div className="flex flex-wrap items-center justify-end gap-2">
          <ExportButtons
            disabled={loading || items.length === 0}
            onExportCSV={() => handleExportData('csv')}
            onExportJSON={() => handleExportData('json')}
            onExportPDF={() => {
               toast.info('Fitur export PDF Galeri sedang dalam pengembangan');
            }}
          />
        </div>
      </div>

        {/* Live statistics component widgets */}
        <SummaryStats items={items} />

        {/* Dashboard Grid System */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Main Gallery Section (Wide Column) */}
          <section className="lg:col-span-3 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
            
            {/* Filter and Control Area */}
            <div className="p-5 border-b border-slate-200 dark:border-gray-900 bg-slate-50 dark:bg-gray-800 space-y-4">
              <div className="flex flex-col md:flex-row items-center gap-3">
                {/* Search Bar */}
                <div className="relative w-full md:flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Cari berdasarkan judul, fotografer, deskripsi..."
                    value={filters.query}
                    onChange={(e) => handleFilterChange({ query: e.target.value })}
                    className="w-full pl-9 pr-10 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:focus:ring-brand-500/20 outline-none rounded-lg text-xs transition-all dark:text-white"
                  />
                  {filters.query && (
                    <button
                      onClick={() => handleFilterChange({ query: '' })}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Filter counts or clear trigger */}
                {(filters.category !== '' || filters.status !== '' || filters.query !== '' || filters.sortBy !== 'date_desc') && (
                  <button
                    onClick={handleClearFilters}
                    className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 shrink-0 hover:underline cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Hapus Filter
                  </button>
                )}
              </div>

              {/* Advanced Filter Select Controls */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                {/* Category Filter */}
                <div className="col-span-1">
                  <label htmlFor="filter-category-select" className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Kategori</label>
                  <select
                    id="filter-category-select"
                    value={filters.category}
                    onChange={(e) => handleFilterChange({ category: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:focus:ring-brand-500/20 outline-none rounded-lg text-xs transition-all dark:text-white"
                  >
                    <option value="">Semua Kategori</option>
                    <option value="tournament">Turnamen</option>
                    <option value="training">Latihan</option>
                    <option value="event">Event</option>
                    <option value="general">Umum</option>
                  </select>
                </div>

                {/* Status Access Filter */}
                <div className="col-span-1">
                  <label htmlFor="filter-access-select" className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Hak Akses</label>
                  <select
                    id="filter-access-select"
                    value={filters.status}
                    onChange={(e) => handleFilterChange({ status: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:focus:ring-brand-500/20 outline-none rounded-lg text-xs transition-all dark:text-white"
                  >
                    <option value="">Semua Akses</option>
                    <option value="public">Publik Only</option>
                    <option value="private">Privat Only</option>
                  </select>
                </div>

                {/* Sorting options */}
                <div className="col-span-2 md:col-span-2 lg:col-span-2">
                  <label htmlFor="sort-by-select" className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Urutan Berdasarkan</label>
                  <select
                    id="sort-by-select"
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange({ sortBy: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-700 focus:border-brand-500 dark:focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:focus:ring-brand-500/20 outline-none rounded-lg text-xs transition-all dark:text-white"
                  >
                    <option value="date_desc">Tanggal Ditambahkan (Terbaru)</option>
                    <option value="date_asc">Tanggal Ditambahkan (Terlama)</option>
                    <option value="title_asc">Judul Karya (A - Z)</option>
                    <option value="title_desc">Judul Karya (Z - A)</option>
                  </select>
                </div>

                <div className="col-span-2 md:col-span-4 lg:col-span-2 flex items-end justify-end gap-2">
                  <button
                    id="create-item-btn"
                    onClick={() => {
                      setSelectedItemForEdit(undefined);
                      setIsFormOpen(true);
                    }}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Foto
                  </button>
                </div>
              </div>
            </div>

            {/* List/Table content */}
            <div className="flex-1 w-full bg-slate-50 dark:bg-gray-900 p-6">
              
              {processedItems.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-900 border border-dashed border-slate-300 dark:border-gray-700 rounded p-8">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3 pointer-events-none" />
                  <h3 className="text-sm font-bold text-slate-700">Foto Tidak Ditemukan</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-normal">
                    Tidak ada karya foto yang cocok dengan kriteria pencarian atau filter Anda saat ini.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  
                  <AnimatePresence mode="popLayout">
                    {paginatedItems.map((img) => (
                      <motion.div
                        key={img.id}
                        layoutId={`card-${img.id}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white dark:bg-gray-800 rounded border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col group hover:shadow-md hover:border-slate-300 dark:hover:border-gray-600 transition duration-150"
                      >
                        {/* Visual Image Section */}
                        <div className="relative aspect-video bg-slate-800 overflow-hidden cursor-pointer">
                          <img
                            src={img.image_url}
                            alt={img.title}
                            onClick={() => setLightboxItem(img)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300 pointer-events-auto"
                          />
                          
                          {/* Floating Category Badge */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-widest bg-slate-900/75 text-white backdrop-blur-sm select-none">
                              {img.category || 'Umum'}
                            </span>
                          </div>

                          {/* Floating Access Status Badge */}
                          <button
                            onClick={() => handleToggleAccess(img.id, img.is_published, img.title)}
                            title="Klik untuk mengubah akses kontrol"
                            className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-widest backdrop-blur-sm flex items-center gap-1 select-none pointer-events-auto cursor-pointer ${
                              img.is_published 
                                ? 'bg-emerald-500/85 text-white hover:bg-emerald-600' 
                                : 'bg-red-500/85 text-white hover:bg-red-600'
                            }`}
                          >
                            {img.is_published ? (
                              <>
                                <Eye className="w-2.5 h-2.5" />
                                Publik
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-2.5 h-2.5" />
                                Privat
                              </>
                            )}
                          </button>

                          {/* Hover Overlay Button to Quick Enlarge */}
                          <div 
                            onClick={() => setLightboxItem(img)}
                            className="absolute inset-0 bg-slate-900/25 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center pointer-events-auto"
                          >
                            <span className="px-3 py-1.5 bg-white text-slate-800 text-[10px] font-bold tracking-wider uppercase rounded shadow-md flex items-center gap-1">
                              Selengkapnya <ExternalLink className="w-3 h-3 text-slate-400 pointer-events-none" />
                            </span>
                          </div>
                        </div>

                        {/* Description & Metadata Section */}
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <h3 
                              onClick={() => setLightboxItem(img)}
                              className="text-sm font-bold text-slate-900 dark:text-white tracking-tight hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer truncate"
                              title={img.title}
                            >
                              {img.title}
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                              {img.description || 'Tidak ada deskripsi.'}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-slate-100 dark:border-gray-700 mt-4 space-y-3">
                            {/* Artist/Photographer Credit */}
                            {/* <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-gray-500 font-mono">
                              <div className="flex items-center gap-1 cursor-default">
                                <User className="w-3 h-3 text-slate-400 dark:text-gray-500" />
                                <span>{img.profile?.fullname || img.uploaded_by}</span>
                              </div>
                            </div> */}

                            {/* Actions panel */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100/50 dark:border-gray-700/50">
                              <span className="text-[9px] text-slate-400 dark:text-gray-500 font-mono flex items-center gap-1 cursor-default">
                                <Calendar className="w-3 h-3" />
                                {formatDateString(img.taken_at || img.created_at)}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedItemForEdit(img);
                                    setIsFormOpen(true);
                                  }}
                                  title="Edit data foto ini"
                                  className="p-1.5 border border-slate-200 dark:border-gray-600 hover:border-slate-300 dark:hover:border-gray-500 rounded hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition duration-150 cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedItemForDelete(img);
                                    setIsDeleteOpen(true);
                                  }}
                                  title="Hapus foto dari galeri"
                                  className="p-1.5 border border-slate-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-800 rounded hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition duration-150 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div 
                id="pagination-container"
                className="p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50"
              >
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                  Menampilkan <strong className="text-slate-900">{Math.min((currentPage - 1) * itemsPerPage + 1, processedItems.length)}</strong> sampai{' '}
                  <strong className="text-slate-900">{Math.min(currentPage * itemsPerPage, processedItems.length)}</strong> dari{' '}
                  <strong className="text-slate-900">{processedItems.length}</strong> foto
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-9 h-9 text-xs rounded font-bold border transition ${
                        currentPage === pageNum
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-slate-200 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Sidebar Area (Statistik & Logs) */}
          <section className="space-y-6 lg:sticky lg:top-6">
            
            {/* Quick Policy & Info Card */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-slate-200 dark:border-gray-800 shadow-sm space-y-4">
              <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-1 cursor-default">
                <BadgeCheck className="w-4 h-4 text-emerald-600 pointer-events-none" />
                Validitas & Integrasi
              </h4>
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                Terkoneksi langsung dengan <strong>Supabase</strong>. Semua data secara otomatis disimpan secara persisten.
              </p>
              <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed pt-1.5 border-t border-slate-100 dark:border-gray-800">
                Gunakan tombol <strong>Ekspor Basis Data</strong> di atas untuk mengunduh cadangan data tabel galeri ini.
              </p>
            </div>

            {/* Side Activity Logs Component */}
            <ActivityLogs logs={logs} onClear={handleClearLogs} />
          </section>
        </div>


      {/* --- INTEGRATED MODALS & OVERLAYS --- */}

      {/* App Form Modal (Add / Edit) */}
      <AnimatePresence>
        {isFormOpen && (
          <GalleryForm
            itemToEdit={selectedItemForEdit}
            onClose={() => {
              setIsFormOpen(false);
              setSelectedItemForEdit(undefined);
            }}
            onSubmit={handleFormSubmit}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteOpen && selectedItemForDelete && (
          <DeleteGaleriModal
            item={selectedItemForDelete}
            onConfirm={handleDeleteConfirm}
            onClose={() => {
              setIsDeleteOpen(false);
              setSelectedItemForDelete(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Image Lightbox View / Expansion Overlay Modal */}
      <AnimatePresence>
        {lightboxItem && (
          <div 
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxItem(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()} 
              className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-slate-200 dark:border-gray-800 max-w-4xl w-full overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Left Side: Large Image */}
              <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden aspect-video md:aspect-auto">
                <img 
                  src={lightboxItem.image_url} 
                  alt={lightboxItem.title} 
                  className="w-full h-full object-contain max-h-[80vh]"
                />
                
                <button
                  onClick={handleLightboxPrev}
                  className="absolute left-4 p-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full transition cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={handleLightboxNext}
                  className="absolute right-4 p-2 bg-slate-900/60 hover:bg-slate-900 text-white rounded-full transition cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Right Side: Visual Metadata info */}
              <div className="w-full md:w-80 p-5 flex flex-col justify-between bg-white dark:bg-gray-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-gray-800 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 border border-slate-200 dark:border-gray-700 select-none">
                      {lightboxItem.category || 'Umum'}
                    </span>
                    <button
                      onClick={() => setLightboxItem(null)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white leading-snug">{lightboxItem.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                      {lightboxItem.description || 'Tidak ada deskripsi.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-gray-700 space-y-2.5 text-xs text-slate-600 dark:text-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">PENGUNGGAH</span>
                      <span className="font-semibold text-indigo-700 dark:text-indigo-400">{lightboxItem.profile?.fullname || lightboxItem.uploaded_by || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">TANGGAL DIBUAT</span>
                      <span className="font-medium text-slate-500 dark:text-gray-400 font-mono">{formatDateString(lightboxItem.created_at)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">HAK AKSES</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        lightboxItem.is_published 
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                          : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {lightboxItem.is_published ? 'Publik' : 'Privat'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-gray-700 mt-6 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedItemForEdit(lightboxItem);
                      setIsFormOpen(true);
                    }}
                    className="flex-1 py-1.5 border border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700 rounded text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-gray-300 text-center transition cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedItemForDelete(lightboxItem);
                      setIsDeleteOpen(true);
                    }}
                    className="flex-1 py-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400 text-center transition cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
