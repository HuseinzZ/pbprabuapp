import UserForm from "@/components/admin-users/UserForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function AddPlayerPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Tambah User" paths={[{ name: "Manajemen User", href: "/admin/users" }]} />
      <UserForm />
    </div>
  );
}
