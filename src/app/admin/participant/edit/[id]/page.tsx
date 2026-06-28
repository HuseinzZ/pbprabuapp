import ParticipantForm from "@/components/participant/ParticipantForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default async function EditParticipantPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Edit Peserta" paths={[{ name: "Peserta", href: "/admin/participant" }]} />
      <ParticipantForm participantId={resolvedParams.id} />
    </div>
  );
}
