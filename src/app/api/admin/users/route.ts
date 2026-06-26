import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Lazy init — dibuat saat request, bukan saat build
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY belum ditambahkan di file .env.local. " +
      "Silakan tambahkan key tersebut dari dashboard Supabase (Project Settings -> API -> service_role secret)."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

// ─── GET: Ambil mapping email dari auth.users ────────────────────────────────
export async function GET() {
  try {
    const supabaseAdmin = getAdminClient();
    // Ambil daftar user dari auth admin (bisa paging jika user sangat banyak, 
    // tapi listUsers secara default mengambil 50-1000 tergantung API)
    // Untuk data di atas 1000 butuh pagination (perpage max 1000)
    let allUsers: any[] = [];
    let page = 1;
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page: page,
        perPage: 1000
      });
      if (error) throw error;
      allUsers = allUsers.concat(data.users);
      if (data.users.length < 1000) break;
      page++;
    }

    const emailMap: Record<string, string> = {};
    for (const u of allUsers) {
      emailMap[u.id] = u.email || "";
    }

    return NextResponse.json({ emailMap }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── POST: Buat user baru ──────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const {
      fullname, username, email, password, gender, role,
      level, is_active, avatar_url, address, height, hand_dominance, birth_date
    } = await req.json();

    if (!fullname || fullname.length < 3) {
      return NextResponse.json({ error: "Nama lengkap wajib diisi (minimal 3 karakter)" }, { status: 400 });
    }

    const authEmail = email || `user_${Date.now()}@pbprabu.local`;
    const authPassword = password || (Math.random().toString(36).slice(-8) + "Aa1!");

    // 1. Buat auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password: authPassword,
      email_confirm: true,
      user_metadata: { full_name: fullname, role: role || "user" },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 3. Upsert tabel profile
    const { error: profileErr } = await supabaseAdmin
      .from("profile")
      .upsert({
        user_id: userId,
        fullname,
        username: username || null,
        role: role || "user",
        gender: gender || null,
        level: level || null,
        is_active: is_active ?? true,
        avatar_url: avatar_url || null,
        address: address || null,
        height: height || null,
        hand_dominance: hand_dominance || null,
        birth_date: birth_date || null,
        joined_at: new Date().toISOString().split("T")[0],
      }, { onConflict: "user_id" });

    if (profileErr) {
      return NextResponse.json({ error: "Gagal membuat profil: " + profileErr.message }, { status: 400 });
    }

    return NextResponse.json({
      user: authData.user,
      generatedEmail: !email ? authEmail : undefined,
      generatedPassword: !password ? authPassword : undefined,
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── PUT: Update user ─────────────────────────────────────────────────────────
export async function PUT(req: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const {
      id, fullname, username, email, password, gender, role,
      level, is_active, avatar_url, address, height, hand_dominance, birth_date
    } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "ID profil diperlukan" }, { status: 400 });
    }

    // Ambil user_id dari profile
    let profileData: any = null;
    
    // Coba cari berdasarkan id (digunakan oleh UserForm)
    const { data: dataById } = await supabaseAdmin
      .from("profile")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    profileData = dataById;

    // Jika tidak ketemu, coba cari berdasarkan user_id (digunakan oleh ResetPasswordForm)
    if (!profileData) {
      const { data: dataByUserId } = await supabaseAdmin
        .from("profile")
        .select("id, user_id")
        .eq("user_id", id)
        .maybeSingle();
      profileData = dataByUserId;
    }

    if (!profileData) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 });
    }

    const userId = (profileData as any).user_id;

    // Update auth user (email/password)
    if (userId) {
      const authUpdate: any = {};
      if (email) authUpdate.email = email;
      if (password) authUpdate.password = password;
      if (fullname || role) {
        authUpdate.user_metadata = {};
        if (fullname) authUpdate.user_metadata.full_name = fullname;
        if (role) authUpdate.user_metadata.role = role;
      }

      if (Object.keys(authUpdate).length > 0) {
        const { error: authErr } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdate);
        if (authErr) {
          return NextResponse.json({ error: "Gagal update auth: " + authErr.message }, { status: 400 });
        }
      }
    }

    // Update tabel profile
    const profileUpdate: any = {};
    if (fullname !== undefined) profileUpdate.fullname = fullname;
    if (role !== undefined) profileUpdate.role = role;
    if (username !== undefined) profileUpdate.username = username;
    if (gender !== undefined) profileUpdate.gender = gender;
    if (level !== undefined) profileUpdate.level = level;
    if (is_active !== undefined) profileUpdate.is_active = is_active;
    if (avatar_url !== undefined) profileUpdate.avatar_url = avatar_url;
    if (address !== undefined) profileUpdate.address = address;
    if (height !== undefined) profileUpdate.height = height;
    if (hand_dominance !== undefined) profileUpdate.hand_dominance = hand_dominance;
    if (birth_date !== undefined) profileUpdate.birth_date = birth_date;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileErr } = await supabaseAdmin
        .from("profile")
        .update(profileUpdate)
        .eq("id", profileData.id);

      if (profileErr) {
        return NextResponse.json({ error: "Gagal update profil: " + profileErr.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─── DELETE: Hapus auth user ──────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const supabaseAdmin = getAdminClient();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "User ID diperlukan" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
