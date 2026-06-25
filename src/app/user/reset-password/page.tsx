import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Ubah Password | PB Prabu Bandung",
    description: "Halaman Ubah Password",
};

export default async function ResetPasswordUserPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pt-24 pb-10 px-4 md:px-8">
            <div className="space-y-6">
                <div className="max-w-2xl mx-auto">
                    {/* Menggunakan ResetPasswordForm tanpa prop userId berarti akan mereset password user yang sedang login */}
                    <ResetPasswordForm />
                </div>
            </div>
        </div>
    );
}
