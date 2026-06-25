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

// POST /api/user/register-tournament
export async function POST(req: Request) {
  try {
    // 1. Verifikasi user yang sedang login via server client (anon key + cookie)
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { tournament_id } = await req.json();
    if (!tournament_id) {
      return NextResponse.json({ error: "tournament_id wajib diisi." }, { status: 400 });
    }

    // 2. Gunakan admin client (bypass RLS) untuk operasi data
    const admin = getAdminClient();

    // 3. Ambil profile_id milik user yang login
    const { data: profileData, error: profileErr } = await admin
      .from("profile")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileErr || !profileData) {
      return NextResponse.json(
        { error: "Profil tidak ditemukan. Silakan lengkapi profil Anda terlebih dahulu." },
        { status: 404 }
      );
    }

    const profile_id = profileData.id;

    // 4. Cek turnamen ada dan statusnya masih bisa didaftar
    const { data: tournament, error: tErr } = await admin
      .from("tournaments")
      .select("id, name, status, max_participants")
      .eq("id", tournament_id)
      .single();

    if (tErr || !tournament) {
      return NextResponse.json({ error: "Turnamen tidak ditemukan." }, { status: 404 });
    }

    if (tournament.status !== "upcoming" && tournament.status !== "registration") {
      return NextResponse.json(
        { error: "Turnamen ini sudah tidak menerima pendaftaran." },
        { status: 400 }
      );
    }

    // 5. Cek apakah sudah terdaftar
    const { data: existing } = await admin
      .from("tournament_participants")
      .select("id, status")
      .eq("tournament_id", tournament_id)
      .eq("profile_id", profile_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Anda sudah terdaftar di turnamen ini.", status: existing.status },
        { status: 409 }
      );
    }

    // 6. Cek kuota (jika ada max_participants)
    if (tournament.max_participants && tournament.max_participants > 0) {
      const { count } = await admin
        .from("tournament_participants")
        .select("*", { count: "exact", head: true })
        .eq("tournament_id", tournament_id)
        .neq("status", "withdrawn");

      if (count !== null && count >= tournament.max_participants) {
        return NextResponse.json(
          { error: "Kuota turnamen sudah penuh." },
          { status: 400 }
        );
      }
    }

    // 7. Insert peserta baru dengan status pending
    const { data: newParticipant, error: insertErr } = await admin
      .from("tournament_participants")
      .insert({
        tournament_id,
        profile_id,
        status: "pending",
        payment_status: "unpaid",
        registered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      if (insertErr.message.includes("unique") || insertErr.message.includes("duplicate")) {
        return NextResponse.json(
          { error: "Anda sudah terdaftar di turnamen ini." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Pendaftaran berhasil! Status Anda: Menunggu Konfirmasi.`,
        participant: newParticipant,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
