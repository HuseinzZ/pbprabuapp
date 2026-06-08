'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, ShieldCheck, Loader2, Check, X, AlertCircle, CheckCircle2, MailWarning } from 'lucide-react';
import Loader from '@/components/shared/Loader';

// Tipe notifikasi
type NotifType = 'success' | 'error' | 'warning' | null;

interface Notif {
  type: NotifType;
  message: string;
}

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState<Notif | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Aturan validasi
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordValid = password.length >= 8;

  function showNotif(type: NotifType, message: string) {
    setNotif({ type, message });
    // Auto dismiss setelah 4 detik
    setTimeout(() => setNotif(null), 4000);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setNotif(null);

    let isValid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      showNotif('error', 'Email tidak boleh kosong');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      showNotif('error', 'Format email tidak valid');
      isValid = false;
    }

    if (!password) {
      if (isValid) showNotif('error', 'Password tidak boleh kosong');
      isValid = false;
    } else if (password.length < 8) {
      if (isValid) showNotif('error', 'Password wajib minimal 8 karakter');
      isValid = false;
    }

    if (!isValid) return;

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message === 'Email not confirmed') {
        showNotif('warning', 'Email belum dikonfirmasi. Cek inbox Anda.');
      } else {
        showNotif('error', 'Email atau password salah');
      }
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      showNotif('success', 'Berhasil masuk...');
      setTimeout(() => {
        router.push(profile?.role === 'admin' ? '/admin' : '/');
        router.refresh();
      }, 1000);
    }
    setLoading(false);
  }

  // Konfigurasi tampilan per tipe notifikasi
  const notifConfig = {
    success: {
      icon: <CheckCircle2 size={16} className="flex-shrink-0" />,
      bg: 'bg-green-50 dark:bg-green-950/40',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    error: {
      icon: <AlertCircle size={16} className="flex-shrink-0" />,
      bg: 'bg-red-50 dark:bg-red-950/40',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-500 dark:text-red-400',
    },
    warning: {
      icon: <MailWarning size={16} className="flex-shrink-0" />,
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-200',
      iconColor: 'text-amber-500 dark:text-amber-400',
    },
  };

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--bg)]/80 backdrop-blur-sm">
          <Loader />
        </div>
      )}

      <div className="w-full max-w-[420px] animate-fade-in">
        {/* Card */}
        <div className="card p-7 shadow-xl border border-white/10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <Image src="/1.png" alt="PB Prabu Bandung" width={64} height={64} priority style={{ width: "auto", height: "auto" }} />
            <h2
              className="font-display font-bold text-lg mt-3"
              style={{ color: 'var(--text)' }}
            >
              Masuk ke Akun Anda
            </h2>
          </div>

          {/* ✅ NOTIFIKASI INLINE — di dalam card, tidak keluar garis */}
          <div
            className={`
                              overflow-hidden transition-all duration-300 ease-in-out
                              ${notif ? 'max-h-20 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}
                          `}
          >
            {notif && (() => {
              const cfg = notifConfig[notif.type!];
              return (
                <div className={`
                                      flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-sm
                                      ${cfg.bg} ${cfg.border} ${cfg.text}
                                  `}>
                  <span className={cfg.iconColor}>{cfg.icon}</span>
                  <span className="flex-1 leading-snug">{notif.message}</span>
                  <button
                    onClick={() => setNotif(null)}
                    className={`flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity ${cfg.iconColor}`}
                    aria-label="Tutup notifikasi"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })()}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
                style={{ color: 'var(--text-secondary)' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="Masukan alamat email anda"
                required
                autoComplete="email"
              />
              {email && !emailValid && (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                  {/* <AlertCircle size={12} /> */}
                  <span>Masukan email dengan benar</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                style={{ color: 'var(--text-secondary)' }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Masukan password anda"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {password && !passwordValid && (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                  {/* <AlertCircle size={12} /> */}
                  <span>Password minimal 8 karakter, mengandung huruf kecil, huruf besar, angka dan simbol</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="bg-brand-500 hover:bg-brand-600 text-white w-full flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 gap-2 mt-2"
              style={{ padding: '0.75rem' }}
            >
              {loading
                ? <><Loader2 size={15} className="animate-spin" /><span>Memproses...</span></>
                : <><ShieldCheck size={15} /><span>Masuk</span></>
              }
            </button>
          </form>

          {/* Divider */}
          <div className="divider my-6">atau</div>

          {/* Register link */}
          <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            Belum punya akun?{' '}
            <Link
              href="/auth/register"
              className="font-semibold hover:underline transition-colors"
              style={{ color: 'var(--text)' }}
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}