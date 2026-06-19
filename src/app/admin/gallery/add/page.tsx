import { Metadata } from "next";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AddGalleryClient from "./AddGalleryClient";

export const metadata: Metadata = {
  title: "Tambah Foto | Admin PB Prabu",
  description: "Tambahkan foto baru ke galeri PB Prabu Bandung",
};

export default function AddGalleryPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Tambah Foto" paths={[{ name: "Galeri Foto", href: "/admin/gallery" }]} />
      <AddGalleryClient />
    </div>
  );
}
