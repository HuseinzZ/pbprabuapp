import EditProfileForm from "@/components/user-profile/EditProfileForm";
import SponsorSection from "@/components/users/SponsorSection";
import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";


export default async function EditUserProfile() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    return (
        <>
            <div className="max-w-4xl mx-auto space-y-6 pb-10 pt-28 px-4 md:px-8">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">Ubah Profil</h1>
                    <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">Perbarui profil anda</p>
                </div>
                <EditProfileForm userId={user.id} returnUrl="/user/profile" />
            </div>
            <SponsorSection />
        </>
    );
}
