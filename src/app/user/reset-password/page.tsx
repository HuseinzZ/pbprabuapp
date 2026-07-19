import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SponsorSection from "@/components/users/SponsorSection";

export default async function ResetPasswordUserPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    return (
        <div className="pt-24 md:pt-32 pb-16 px-4 md:px-8 xl:px-16 max-w-[1440px] mx-auto min-h-screen page-fade-in flex flex-col justify-between">
            <div className="space-y-12 mb-16">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">Ubah Password</h1>
                    <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">Perbarui kata sandi Anda untuk menjaga keamanan akun</p>
                </div>

                <div className="max-w-2xl mx-auto">
                    {/* Menggunakan ResetPasswordForm tanpa prop userId berarti akan mereset password user yang sedang login */}
                    <ResetPasswordForm />
                </div>
            </div>

            {/* Sponsor strip */}
            <div className="mt-auto">
                <SponsorSection />
            </div>
        </div>
    );
}
