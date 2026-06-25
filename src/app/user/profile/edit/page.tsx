import EditProfileForm from "@/components/user-profile/EditProfileForm";
import SponsorSection from "@/components/users/SponsorSection";
import { Metadata } from "next";
import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Edit Profil | PB Prabu Bandung",
    description: "Edit profil pengguna",
};

export default async function EditUserProfile() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-6 pb-10 pt-28 px-4 md:px-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Edit Profil</h1>
                    <p className="text-gray-500 text-sm mt-1">Perbarui informasi profil Anda.</p>
                </div>
                <EditProfileForm userId={user.id} returnUrl="/user/profile" />
            </div>
            <SponsorSection />
        </>
    );
}
