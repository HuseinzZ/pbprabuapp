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
    <div>
      <PageBreadcrumb pageTitle="Edit Pemain" />
      <PlayerForm playerId={id} />
    </div>
  );
}
