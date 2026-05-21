"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AlertCircle, CheckCircle2, Trash2, Save, ArrowLeft,
  Upload, X, Camera, ImagePlus,
} from "lucide-react";
import ComponentCard from "@/components/common/ComponentCard";
import Loader from "@/components/shared/Loader";
import Switch from "@/components/form/switch/Switch";
import DatePicker from "@/components/form/DatePicker";
import { GalleryItem, GalleryCategory, CATEGORY_LABELS } from "@/app/admin/gallery/types";
import { deleteStorageFile } from "@/lib/utils/storage";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface GalleryFormProps {
  galleryId?: string;
  initialData?: GalleryItem;
}

interface PhotoEntry {
  id: string;          // local id
  file: File;
  preview: string;     // object URL
  title: string;
}

type NotifType = "success" | "error" | null;
interface Notif { type: NotifType; message: string; }

const FIELD_CLASS =
  "w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-shadow disabled:opacity-50";

const CATEGORIES: GalleryCategory[] = ["tournament", "training", "event", "general"];
const MAX_MB = 5;

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fileToTitle(file: File) {
  return file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function GalleryForm({ galleryId, initialData }: GalleryFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!galleryId;

  // ── Shared fields (add & edit) ──────────────────────────────────────────────
  const [sharedCategory, setSharedCategory] = useState<GalleryCategory>(
    initialData?.category ?? "general"
  );
  const [sharedDate, setSharedDate] = useState(initialData?.taken_at ?? "");
  const [sharedPublish, setSharedPublish] = useState(initialData?.is_published ?? true);

  // ── Single-edit fields ──────────────────────────────────────────────────────
  const [editForm, setEditForm] = useState({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    image_url: initialData?.image_url ?? "",
  });

  // ── Multi-add queue ─────────────────────────────────────────────────────────
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  // ── State ───────────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [notif, setNotif] = useState<Notif | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  function handleBack() {
    setNavigating(true);
    router.push("/admin/gallery");
  }

  const fileInputRef = useRef<HTMLInputElement>(null);   // add-mode multi
  const editFileRef = useRef<HTMLInputElement>(null);   // edit-mode single

  function showNotif(type: NotifType, message: string) {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 4000);
  }

  // ─── Add mode: pick files ───────────────────────────────────────────────────

  const handleFilePick = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const oversized = files.filter((f) => f.size > MAX_MB * 1024 * 1024);
    if (oversized.length) {
      showNotif("error", `${oversized.length} file melebihi batas ${MAX_MB}MB dan dilewati.`);
    }

    const valid = files.filter((f) => f.size <= MAX_MB * 1024 * 1024);
    const entries: PhotoEntry[] = valid.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
      title: fileToTitle(file),
    }));
    setPhotos((prev) => [...prev, ...entries]);
    // reset so same file can be picked again
    e.target.value = "";
  }, []);

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const entry = prev.find((p) => p.id === id);
      if (entry) URL.revokeObjectURL(entry.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const updateTitle = (id: string, title: string) => {
    setPhotos((prev) => prev.map((p) => p.id === id ? { ...p, title } : p));
  };

  // ─── Add mode: upload & insert all ─────────────────────────────────────────

  async function handleSaveAll() {
    if (!photos.length) { showNotif("error", "Pilih minimal satu foto terlebih dahulu."); return; }
    const missing = photos.filter((p) => !p.title.trim());
    if (missing.length) { showNotif("error", "Semua foto harus memiliki judul."); return; }

    setSaving(true);
    setUploadProgress({ done: 0, total: photos.length });

    const inserts: object[] = [];

    for (let i = 0; i < photos.length; i++) {
      const { file, title } = photos[i];
      const ext = file.name.split(".").pop();
      const filePath = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("gallery")
        .upload(filePath, file, { upsert: true });

      if (uploadErr) {
        showNotif("error", `Gagal upload "${file.name}": ${uploadErr.message}`);
        setSaving(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("gallery").getPublicUrl(filePath);
      inserts.push({
        title: title.trim(),
        image_url: publicUrl,
        category: sharedCategory || null,
        taken_at: sharedDate || null,
        is_published: sharedPublish,
      });
      setUploadProgress({ done: i + 1, total: photos.length });
    }

    const { error: insertErr } = await supabase.from("gallery").insert(inserts);
    if (insertErr) {
      showNotif("error", "Gagal menyimpan ke database: " + insertErr.message);
      setSaving(false);
      return;
    }

    showNotif("success", `${inserts.length} foto berhasil ditambahkan!`);
    setTimeout(() => router.push("/admin/gallery"), 800);
  }

  // ─── Edit mode: upload single image ────────────────────────────────────────

  async function handleEditImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) { showNotif("error", `Maks. ${MAX_MB}MB`); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `gallery/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("gallery").upload(filePath, file, { upsert: true });
    if (error) { showNotif("error", "Gagal upload: " + error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("gallery").getPublicUrl(filePath);
    setEditForm((p) => ({ ...p, image_url: `${publicUrl}?t=${Date.now()}` }));
    setUploading(false);
  }

  // ─── Edit mode: save ────────────────────────────────────────────────────────

  async function handleSaveEdit() {
    if (!editForm.title.trim()) { showNotif("error", "Judul wajib diisi"); return; }
    if (!editForm.image_url) { showNotif("error", "Foto wajib ada"); return; }
    setSaving(true);

    const imageChanged = initialData && initialData.image_url !== editForm.image_url;

    const { error } = await supabase.from("gallery").update({
      title: editForm.title.trim(),
      description: editForm.description.trim() || null,
      image_url: editForm.image_url,
      category: sharedCategory || null,
      taken_at: sharedDate || null,
      is_published: sharedPublish,
      updated_at: new Date().toISOString(),
    }).eq("id", galleryId!);
    if (error) { showNotif("error", "Gagal simpan: " + error.message); setSaving(false); return; }

    if (imageChanged && initialData?.image_url) {
      await deleteStorageFile(initialData.image_url, "gallery");
    }

    showNotif("success", "Foto berhasil diperbarui!");
    setTimeout(() => router.push("/admin/gallery"), 800);
  }

  // ─── Edit mode: delete ──────────────────────────────────────────────────────

  async function handleDelete() {
    setDeleting(true);
    const { error } = await supabase.from("gallery").delete().eq("id", galleryId!);
    if (error) { showNotif("error", "Gagal hapus: " + error.message); setDeleting(false); setShowDelete(false); return; }

    if (initialData?.image_url) {
      await deleteStorageFile(initialData.image_url, "gallery");
    }

    router.push("/admin/gallery");
  }

  const isProcessing = saving || deleting || uploading || navigating;

  // ─── Shared field panel ─────────────────────────────────────────────────────

  const SharedFields = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Kategori</label>
        <select
          value={sharedCategory}
          onChange={(e) => setSharedCategory(e.target.value as GalleryCategory)}
          disabled={isProcessing}
          className={FIELD_CLASS}
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Tanggal Pengambilan</label>
        <DatePicker
          id="gallery-taken-at"
          value={sharedDate}
          onChange={(date) => setSharedDate(date)}
          placeholder="Pilih tanggal..."
          maxDate="today"
        />
      </div>
      <div className="flex items-end">
        <div className="flex items-center justify-between w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="mr-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Publikasikan</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tampil di galeri publik</p>
          </div>
          <Switch
            label=""
            defaultChecked={sharedPublish}
            onChange={setSharedPublish}
            disabled={isProcessing}
          />
        </div>
      </div>
    </div>
  );

  // ─── Footer ─────────────────────────────────────────────────────────────────

  const Footer = ({ onSave, canSave }: { onSave: () => void; canSave: boolean }) => (
    <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          disabled={isProcessing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {navigating ? (
            <><ArrowLeft className="w-4 h-4 animate-pulse" /> Kembali...</>
          ) : (
            <><ArrowLeft className="w-4 h-4" /> Kembali</>
          )}
        </button>
        {isEdit && (
          <button type="button" onClick={() => setShowDelete(true)} disabled={isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium transition-colors disabled:opacity-50">
            <Trash2 className="w-4 h-4" /> Hapus Foto
          </button>
        )}
      </div>
      <button type="button" onClick={onSave} disabled={isProcessing || !canSave}
        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-sm">
        <Save className="w-4 h-4" />
        {saving
          ? uploadProgress.total > 1
            ? `Mengupload ${uploadProgress.done}/${uploadProgress.total}...`
            : "Menyimpan..."
          : isEdit ? "Simpan Perubahan" : `Simpan ${photos.length > 1 ? `${photos.length} Foto` : "Foto"}`}
      </button>
    </div>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Loader Overlay — only covers the form area, not header/sidebar/footer
      {isProcessing && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm rounded-2xl">
          <Loader />
        </div>
      )} */}
      

      {/* Notif */}
      {notif && (
        <div className={`fixed top-6 right-6 z-[9998] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${notif.type === "success"
          ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-700/50 dark:text-green-400"
          : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-700/50 dark:text-red-400"
          }`}>
          {notif.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {notif.message}
        </div>
      )}

      {/* Delete Modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDelete(false)} />
          <div className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-500/10"><AlertCircle className="w-5 h-5 text-red-500" /></div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Hapus Foto</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              Yakin ingin menghapus foto <span className="font-semibold text-gray-900 dark:text-white">"{editForm.title}"</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDelete(false)} disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Batal</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ ADD MODE ══ */}
      {!isEdit && (
        <ComponentCard title="Tambah Foto Baru" desc="Pilih satu atau beberapa foto sekaligus — setiap foto dapat diberi judul tersendiri.">
          {/* Drop zone / pick files */}
          <div
            className="flex flex-col py-4 items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-brand-400 hover:bg-brand-50/20 dark:hover:bg-brand-900/10 transition-all cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 transition-colors">
              <ImagePlus className="w-7 h-7 text-gray-400 group-hover:text-brand-500 transition-colors" />
            </div>
            <div className="text-center py-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Klik atau seret foto ke sini</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG, WEBP — Maks. {MAX_MB}MB per foto — Bisa pilih banyak sekaligus</p>
            </div>
            {/* <button type="button"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors">
              <Upload className="w-4 h-4" /> Pilih Foto
            </button> */}
          </div>

          <input ref={fileInputRef} type="file" multiple accept="image/png,image/jpeg,image/webp"
            className="hidden" onChange={handleFilePick} disabled={isProcessing} />

          {/* Preview grid */}
          {photos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {photos.length} foto dipilih
                </p>
                <button type="button" onClick={() => setPhotos([])}
                  className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors">
                  Hapus Semua
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="group relative flex flex-col gap-2">
                    {/* Thumbnail */}
                    <div 
                      className="relative w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                      style={{ aspectRatio: "4/3" }}
                    >
                      <Image src={photo.preview} alt={photo.title} fill className="object-cover" unoptimized />
                      <button type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-colors opacity-0 group-hover:opacity-100">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Title input per photo */}
                    <input
                      type="text"
                      value={photo.title}
                      onChange={(e) => updateTitle(photo.id, e.target.value)}
                      placeholder="Judul foto..."
                      disabled={isProcessing}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-shadow disabled:opacity-50"
                    />
                  </div>
                ))}

                {/* Add more button */}
                {/* <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}
                  className="aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-brand-400 hover:bg-brand-50/20 dark:hover:bg-brand-900/10 transition-all text-gray-400 hover:text-brand-500 disabled:opacity-50">
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-xs font-medium">Tambah Lagi</span>
                </button> */}
              </div>
            </div>
          )}

          {/* Shared settings */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Pengaturan untuk Semua Foto</p>
            <SharedFields />
          </div>

          <Footer onSave={handleSaveAll} canSave={photos.length > 0} />
        </ComponentCard>
      )}

      {/* ══════════════════════════════════════════════════════ EDIT MODE ══ */}
      {isEdit && (
        <ComponentCard title="Edit Foto Galeri" desc="Perbarui informasi dan gambar pada foto ini">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                Foto <span className="text-red-500">*</span>
              </label>
              <div
                className="relative w-full rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 cursor-pointer hover:border-brand-400 hover:bg-brand-50/20 dark:hover:bg-brand-900/10 transition-all group"
                style={{ aspectRatio: "4/3" }}
                onClick={() => !isProcessing && editFileRef.current?.click()}
              >
                {editForm.image_url ? (
                  <>
                    <Image src={editForm.image_url} alt="Preview" fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/95 text-gray-800 text-sm font-medium shadow-lg">
                        <Camera className="w-4 h-4" /> Ganti Foto
                      </span>
                    </div>
                    <button type="button"
                      onClick={(e) => { e.stopPropagation(); setEditForm((p) => ({ ...p, image_url: "" })); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-6">
                    <div className="w-14 h-14 rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400 group-hover:text-brand-500 transition-colors" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Klik untuk upload foto</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG, WEBP — Maks. {MAX_MB}MB</p>
                  </div>
                )}
              </div>
              <input ref={editFileRef} type="file" accept="image/png,image/jpeg,image/webp"
                className="hidden" onChange={handleEditImage} disabled={isProcessing} />
              {uploading && <p className="text-xs text-brand-500 font-medium animate-pulse">Mengupload...</p>}
            </div>

            {/* Fields */}
            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Judul <span className="text-red-500">*</span>
                </label>
                <input id="edit-title" type="text" value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Judul foto..." disabled={isProcessing} className={FIELD_CLASS} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Deskripsi</label>
                <textarea id="edit-desc" rows={3} value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Deskripsi singkat..." disabled={isProcessing}
                  className={`${FIELD_CLASS} resize-none`} />
              </div>
              <SharedFields />
            </div>
          </div>

          <Footer
            onSave={handleSaveEdit}
            canSave={!!editForm.title.trim() && !!editForm.image_url}
          />
        </ComponentCard>
      )}
    </div>
  );
}
