"use client";

import React from "react";
import GalleryForm from "@/components/gallery/GalleryForm";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "react-toastify";
import { GalleryActivityLog } from "../types";

export default function AddGalleryClient() {
  const router = useRouter();
  const supabase = createClient();

  const handleFormSubmit = async (formDataArray: any[]) => {
    // Jalankan operasi INSERT
    const { error } = await supabase.from("gallery").insert(formDataArray);

    if (error) {
      toast.error(`Gagal menambah foto: ${error.message}`);
      return;
    }

    toast.success(`${formDataArray.length} Foto berhasil diunggah.`);

    // Catat log aktivitas
    const newLog: GalleryActivityLog = {
      id: `log-${Date.now()}`,
      action: `${formDataArray.length} karya foto baru diunggah.`,
      timestamp: new Date().toISOString(),
      type: "create",
    };

    try {
      const storedLogs = localStorage.getItem("manajemen_galeri_logs");
      let logs = storedLogs ? JSON.parse(storedLogs) : [];
      logs.unshift(newLog);
      localStorage.setItem("manajemen_galeri_logs", JSON.stringify(logs.slice(0, 100)));
    } catch (e) {
      console.error(e);
    }

    // Redirect kembali ke galeri
    router.push("/admin/gallery");
  };

  return (
    <GalleryForm
      onClose={() => router.push("/admin/gallery")}
      onSubmit={handleFormSubmit}
    />
  );
}
