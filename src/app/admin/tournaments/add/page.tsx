import TournamentForm from "@/components/tournaments/TournamentForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function AddTournamentPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Tambah Turnamen" paths={[{ name: "Turnamen", href: "/admin/tournaments" }]} />
      <TournamentForm />
    </div>
  );
}
