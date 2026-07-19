"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Timeout idle: 30 menit (dalam milidetik)
const IDLE_TIMEOUT = 30 * 60 * 1000;

export default function AutoLogout() {
  const router = useRouter();
  const supabase = createClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleLogout = async () => {
      // Hapus sesi di supabase
      await supabase.auth.signOut();
      
      // Beri tahu pengguna bahwa mereka telah logout
      alert("Sesi Anda telah berakhir karena tidak ada aktivitas selama 30 menit. Silakan login kembali.");
      
      // Redirect ke halaman login
      router.push("/");
    };

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleLogout, IDLE_TIMEOUT);
    };

    // Jalankan timer pertama kali
    resetTimer();

    // Daftar event yang menandakan pengguna sedang aktif
    const events = ["mousemove", "keydown", "wheel", "click", "scroll", "touchstart"];

    // Fungsi debounce sederhana jika perlu, namun resetTimer cukup aman karena clearTimeout cepat
    const handleActivity = () => {
      resetTimer();
    };

    // Pasang event listener ke window
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup saat komponen di-unmount
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [router, supabase]);

  return null; // Komponen ini berjalan di belakang layar, tidak menampilkan UI apapun
}
