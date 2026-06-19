import UserForm from "@/components/users/UserForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit User | PB Prabu Bandung",
  description: "Edit data pemain.",
};

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Edit User" paths={[{ name: "Manajemen User", href: "/admin/users" }]} />
      <UserForm playerId={id} />
    </div>
  );
}
