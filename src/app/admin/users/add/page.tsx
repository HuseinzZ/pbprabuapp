import UserForm from "@/components/users/UserForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tambah User | PB Prabu Bandung",
  description: "Tambah pemain baru.",
};

export default function AddPlayerPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Tambah User" paths={[{ name: "Manajemen User", href: "/admin/users" }]} />
      <UserForm />
    </div>
  );
}
