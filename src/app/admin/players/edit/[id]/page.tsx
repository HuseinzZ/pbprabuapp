import PlayerForm from "@/components/players/PlayerForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Pemain | PB Prabu Bandung",
  description: "Edit data pemain.",
};

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Edit Pemain" paths={[{ name: "Manajemen Pemain", href: "/admin/players" }]} />
      <PlayerForm playerId={id} />
    </div>
  );
}
