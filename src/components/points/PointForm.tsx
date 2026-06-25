"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Point, PointFormData, INITIAL_FORM_DATA, POINT_FIELDS } from "@/app/admin/points/types";
import { AlertCircle, CheckCircle2, Save, ArrowLeft, Info, ListOrdered } from "lucide-react";
import ComponentCard from "@/components/common/ComponentCard";
import Switch from "@/components/form/switch/Switch";

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon,
  title,
  subtitle,
  iconBg = "bg-brand-50 dark:bg-brand-500/10",
  iconColor = "text-brand-600 dark:text-brand-400",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  iconBg?: string;
  iconColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 space-y-5">
      <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100 dark:border-gray-800">
        <div className={`p-2 rounded-lg ${iconBg}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h2>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

interface PointFormProps {
  initialData?: Point;
  mode: "add" | "edit";
}

type NotifType = "success" | "error";
interface Notif { type: NotifType; message: string; }

const FIELD_CLASS =
  "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-500 dark:focus:border-brand-500 transition-all disabled:opacity-50";

export default function PointForm({ initialData, mode }: PointFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = mode === "edit";

  const [form, setForm] = useState<PointFormData>(
    initialData
      ? {
          name: initialData.name,
          points_winner: initialData.points_winner,
          points_finalist: initialData.points_finalist,
          points_semifinalist: initialData.points_semifinalist,
          points_quarterfinalist: initialData.points_quarterfinalist,
          points_r16: initialData.points_r16,
          points_r32: initialData.points_r32,
          points_r64: initialData.points_r64,
          description: initialData.description,
          is_active: initialData.is_active,
        }
      : INITIAL_FORM_DATA
  );

  const [saving, setSaving] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [notif, setNotif] = useState<Notif | null>(null);

  function showNotif(type: NotifType, message: string) {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 4000);
  }

  const addActivityLog = (actionText: string, type: string) => {
    try {
      const stored = localStorage.getItem('manajemen_poin_logs');
      let logs = stored ? JSON.parse(stored) : [];
      logs.push({
        id: `log-${Date.now()}`,
        action: actionText,
        timestamp: new Date().toISOString(),
        type
      });
      logs = logs.slice(-50);
      localStorage.setItem('manajemen_poin_logs', JSON.stringify(logs));
    } catch (e) {
      console.error(e);
    }
  };

  const setField = <K extends keyof PointFormData>(
    key: K,
    value: PointFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  function handleBack() {
    setNavigating(true);
    router.push("/admin/points");
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      showNotif("error", "Nama tipe turnamen wajib diisi.");
      return;
    }

    setSaving(true);

    const payload = {
      ...form,
      name: form.name.trim(),
      description: form.description?.trim() || null,
      points_winner: Number(form.points_winner) || 0,
      points_finalist: Number(form.points_finalist) || 0,
      points_semifinalist: Number(form.points_semifinalist) || 0,
      points_quarterfinalist: Number(form.points_quarterfinalist) || 0,
      points_r16: Number(form.points_r16) || 0,
      points_r32: Number(form.points_r32) || 0,
      points_r64: Number(form.points_r64) || 0,
    };

    let err;
    if (mode === "add") {
      const { error: e } = await supabase.from("points").insert(payload);
      err = e;
    } else {
      const { error: e } = await supabase
        .from("points")
        .update(payload)
        .eq("id", initialData!.id);
      err = e;
    }

    if (err) {
      showNotif("error", "Gagal menyimpan: " + err.message);
      setSaving(false);
      return;
    }

    showNotif(
      "success",
      mode === "add" ? "Tipe turnamen berhasil ditambahkan!" : "Tipe turnamen berhasil diperbarui!"
    );

    if (mode === "add") {
      addActivityLog(`Sistem menambahkan tipe turnamen baru: ${payload.name}`, 'create');
    } else {
      addActivityLog(`Sistem memperbarui tipe turnamen: ${payload.name}`, 'update');
    }

    setTimeout(() => {
      router.push("/admin/points");
      router.refresh();
    }, 1000);
  };

  const isProcessing = saving || navigating;



  return (
    <div>
      {/* Notif */}
      {notif && (
        <div
          className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
            notif.type === "success"
              ? "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300"
              : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
          }`}
        >
          {notif.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {notif.message}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
        
        {/* ── 1. Informasi Dasar ─────────────────────────────────────────── */}
        <SectionCard
          icon={<Info className="w-4 h-4" />}
          title="Informasi Dasar"
          subtitle="Nama dan deskripsi tipe turnamen"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nama Tipe Turnamen <span className="text-red-500">*</span>
              </label>
              <input
                id="field-name"
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="Super 1000"
                disabled={isProcessing}
                className={FIELD_CLASS}
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Deskripsi <span className="text-gray-400 text-xs font-normal">(opsional)</span>
              </label>
              <textarea
                id="field-description"
                value={form.description ?? ""}
                onChange={(e) => setField("description", e.target.value || null)}
                placeholder="Deskripsi singkat tentang tipe turnamen ini..."
                rows={3}
                disabled={isProcessing}
                className={`${FIELD_CLASS} resize-none`}
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-between w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="mr-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Status Aktif</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Tipe turnamen aktif dapat digunakan untuk membuat turnamen baru
                </p>
              </div>
              <Switch
                key={String(form.is_active)}
                label=""
                defaultChecked={form.is_active}
                onChange={(checked) => setField("is_active", checked)}
                disabled={isProcessing}
              />
            </div>
          </div>
        </SectionCard>

        {/* ── 2. Poin per Fase ────────────────────────────────────────── */}
        <SectionCard
          icon={<ListOrdered className="w-4 h-4" />}
          title="Poin per Fase"
          subtitle="Distribusi poin ranking untuk turnamen tipe ini"
          iconBg="bg-amber-50 dark:bg-amber-500/10"
          iconColor="text-amber-600 dark:text-amber-400"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POINT_FIELDS.map(({ key, label, required }) => (
              <div key={key} className="space-y-1.5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="relative">
                  <input
                    id={`field-${key}`}
                    type="number"
                    min={0}
                    value={form[key] === "" ? "" : (form[key] as number) ?? ""}
                    onChange={(e) =>
                      setField(key, (e.target.value === "" ? "" : Number(e.target.value)) as any)
                    }
                    disabled={isProcessing}
                    className={`${FIELD_CLASS} pr-12`}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
          <button
            type="button"
            onClick={handleBack}
            disabled={isProcessing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {navigating ? (
              <><ArrowLeft className="w-4 h-4 animate-pulse" /> Kembali...</>
            ) : (
              <><ArrowLeft className="w-4 h-4" /> Kembali</>
            )}
          </button>

          <button
            type="submit"
            disabled={isProcessing || !form.name.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
