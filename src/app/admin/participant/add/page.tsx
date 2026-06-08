import ParticipantForm from "@/components/participant/ParticipantForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tambah Peserta | PB Prabu Bandung",
  description: "Tambah peserta turnamen baru secara manual.",
};

export default async function AddParticipantPage({ searchParams }: { searchParams: Promise<{ tournament_id?: string }> }) {
  const resolvedSearchParams = await searchParams;
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Tambah Peserta" paths={[{ name: "Peserta", href: "/admin/participant" }]} />
      <ParticipantForm defaultTournamentId={resolvedSearchParams.tournament_id} />
    </div>
  );
}
