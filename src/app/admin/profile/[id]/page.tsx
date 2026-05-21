import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
    title: "Profile | PB Prabu Bandung",
    description:
        "This is Profile page for PB Prabu Bandung",
};

export default async function Profile({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    return (
        <div>
            <PageBreadcrumb pageTitle="Profile" />
            <div className="space-y-6">
                <UserInfoCard userId={resolvedParams.id} />
            </div>
        </div>
    );
}
