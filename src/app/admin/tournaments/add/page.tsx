import TournamentForm from "@/components/tournaments/TournamentForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tambah Turnamen | PB Prabu Bandung",
  description: "Tambah turnamen baru.",
};

export default function AddTournamentPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Tambah Turnamen" paths={[{ name: "Turnamen", href: "/admin/tournaments" }]} />
      <TournamentForm />
    </div>
  );
}
