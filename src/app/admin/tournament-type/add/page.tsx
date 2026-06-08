import TournamentTypeForm from "@/components/tournament-type/TournamentTypeForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tambah Tipe Turnamen | PB Prabu Bandung",
  description: "Tambah tipe turnamen baru beserta poin per fase.",
};

export default function AddTournamentTypePage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Tambah Tipe Turnamen" paths={[{ name: "Tipe Turnamen", href: "/admin/tournament-type" }]} />
      <TournamentTypeForm mode="add" />
    </div>
  );
}
