import PointForm from "@/components/points/PointForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tambah Tipe Turnamen | PB Prabu Bandung",
  description: "Tambah tipe turnamen baru beserta poin per fase.",
};

export default function AddPointPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Tambah Pengaturan Poin" paths={[{ name: "Pengaturan", href: "/admin/points" }]} />
      <PointForm mode="add" />
    </div>
  );
}
