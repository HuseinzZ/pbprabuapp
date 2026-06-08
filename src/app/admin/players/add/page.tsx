import PlayerForm from "@/components/players/PlayerForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tambah Pemain | PB Prabu Bandung",
  description: "Tambah pemain baru.",
};

export default function AddPlayerPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Tambah Pemain" paths={[{ name: "Manajemen Pemain", href: "/admin/players" }]} />
      <PlayerForm />
    </div>
  );
}
