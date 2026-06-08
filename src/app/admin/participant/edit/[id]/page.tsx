import ParticipantForm from "@/components/participant/ParticipantForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Peserta | PB Prabu Bandung",
  description: "Edit data peserta turnamen.",
};

export default async function EditParticipantPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Edit Peserta" paths={[{ name: "Peserta", href: "/admin/participant" }]} />
      <ParticipantForm participantId={resolvedParams.id} />
    </div>
  );
}
