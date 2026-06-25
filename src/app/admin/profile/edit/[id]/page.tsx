import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import EditProfileForm from "@/components/user-profile/EditProfileForm";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Edit Profile | PB Prabu Bandung",
    description: "Edit Profile page for PB Prabu Bandung",
};

export default async function EditProfile({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Edit Profile" paths={[{ name: "Profile", href: `/admin/profile/${resolvedParams.id}` }]} />
            <div className="space-y-6">
                <EditProfileForm userId={resolvedParams.id} />
            </div>
        </div>
    );
}
