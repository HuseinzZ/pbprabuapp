import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Ubah password | PB Prabu Bandung",
    description: "Ubah password.",
};

export default async function ResetPasswordPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    return (
        <div className="space-y-6">
            <PageBreadcrumb pageTitle="Ubah password" />
            <div className="flex justify-center">
                <div className="w-full max-w-[580px]">
                    <ResetPasswordForm userId={id} />
                </div>
            </div>
        </div>
    );
}
