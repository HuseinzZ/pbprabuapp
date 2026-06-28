import PointForm from "@/components/points/PointForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function AddPointPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Tambah Pengaturan Poin" paths={[{ name: "Pengaturan", href: "/admin/points" }]} />
      <PointForm mode="add" />
    </div>
  );
}
