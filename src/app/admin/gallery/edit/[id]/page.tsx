import { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import GalleryForm from "@/components/gallery/GalleryForm";
import { GalleryItem } from "@/app/admin/gallery/types";

export const metadata: Metadata = {
  title: "Edit Foto | Admin PB Prabu",
  description: "Perbarui informasi foto di galeri PB Prabu Bandung",
};

export default async function EditGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item, error } = await supabase
    .from("gallery")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Edit Foto" />
      <GalleryForm galleryId={id} initialData={item as GalleryItem} />
    </div>
  );
}
