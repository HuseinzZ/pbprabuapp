import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.");
  }
  return createAdminClient(supabaseUrl, serviceRoleKey);
}

// DELETE /api/user/cancel-registration
export async function DELETE(req: Request) {
  try {
    // 1. Verifikasi user login
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { participant_id } = await req.json();
    if (!participant_id) {
      return NextResponse.json({ error: "participant_id wajib diisi." }, { status: 400 });
    }

    const admin = getAdminClient();

    // 2. Verifikasi kepemilikan partisipasi (apakah benar milik user yang sedang login)
    // Ambil profile user login
    const { data: profileData } = await admin
      .from("profile")
      .select("id")
      .eq("user_id", user.id)
      .single();
      
    if (!profileData) {
      return NextResponse.json({ error: "Profil tidak ditemukan." }, { status: 404 });
    }

    // Cek apakah data participant benar-benar punya profile ini
    const { data: participantData } = await admin
      .from("tournament_participants")
      .select("id, profile_id")
      .eq("id", participant_id)
      .single();

    if (!participantData) {
      return NextResponse.json({ error: "Data partisipasi tidak ditemukan." }, { status: 404 });
    }

    if (participantData.profile_id !== profileData.id) {
      return NextResponse.json({ error: "Anda tidak berhak membatalkan pendaftaran ini." }, { status: 403 });
    }

    // 3. Hapus pendaftaran
    const { error: deleteErr } = await admin
      .from("tournament_participants")
      .delete()
      .eq("id", participant_id);

    if (deleteErr) {
      return NextResponse.json({ error: "Gagal membatalkan pendaftaran: " + deleteErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Pendaftaran berhasil dibatalkan." }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
