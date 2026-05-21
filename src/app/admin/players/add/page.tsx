import PlayerForm from "@/components/players/PlayerForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tambah Pemain | PB Prabu Bandung",
  description: "Tambah pemain baru.",
};

export default function AddPlayerPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Tambah Pemain" />
      <PlayerForm />
    </div>
  );
}
