'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Loader2, UserPlus, Check, X, AlertCircle, CheckCircle2, MailWarning } from 'lucide-react';
import Loader from '@/components/shared/Loader';

// Tipe notifikasi
type NotifType = 'success' | 'error' | 'warning' | null;

interface Notif {
  type: NotifType;
  message: string;
}

export default function SignUpForm() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [notif, setNotif] = useState<Notif | null>(null);
  const supabase = createClient();

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const passwordLengthValid = form.password.length >= 8;
  const passwordMatch = form.password === form.confirm && form.confirm.length > 0;

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  function showNotif(type: NotifType, message: string) {
    setNotif({ type, message });
    // Auto dismiss setelah 4 detik
    setTimeout(() => setNotif(null), 4000);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setNotif(null);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!form.full_name) { showNotif('error', 'Nama Lengkap tidak boleh kosong'); return; }
    if (!form.email) { showNotif('error', 'Email tidak boleh kosong'); return; }
    if (!emailRegex.test(form.email)) { showNotif('error', 'Format email tidak valid'); return; }
    if (form.password !== form.confirm) { showNotif('error', 'Password tidak cocok'); return; }
    if (form.password.length < 8) { showNotif('error', 'Password minimal 8 karakter'); return; }
    
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.full_name, role: 'user' } },
    });
    if (error) { showNotif('error', error.message); setLoading(false); return; }
    showNotif('success', 'Pendaftaran berhasil!');
    setDone(true);
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

  if (done) return (
    <div className="w-full max-w-[420px] animate-bounce-in">
      <div className="card p-7 text-center shadow-xl border border-white/10">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'linear-gradient(135deg, #ea580c, #fb923c)' }}>
          <Check size={36} className="text-white" />
        </div>
        <h2 className="font-display font-bold text-2xl mb-3" style={{ color: 'var(--text)' }}>
          Registrasi Berhasil!
        </h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Link verifikasi telah dikirim ke <strong>{form.email}</strong>. Silakan cek inbox Anda.
        </p>
        <Link href="/auth/login" className="bg-brand-500 hover:bg-brand-600 text-white font-medium inline-flex items-center justify-center w-full rounded-lg transition-colors" style={{ padding: '0.75rem' }}>
          Ke Halaman Login
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--bg)]/80 backdrop-blur-sm">
          <Loader />
        </div>
      )}

      <div className="w-full max-w-[420px] md:max-w-[700px] animate-fade-in">
        {/* Card */}
          <div className="card p-7 shadow-xl border border-white/10">
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <Image src="/1.png" alt="PB Prabu Bandung" width={64} height={64} priority style={{ width: "auto", height: "auto" }} />
              <h2 className="font-display font-bold text-lg mt-3" style={{ color: 'var(--text)' }}>
                Buat Akun Baru
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

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Nama Lengkap
                  </label>
                  <input type="text" value={form.full_name} onChange={e => update('full_name', e.target.value)}
                    className="input-field" placeholder="Masukan nama lengkap" required />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Email
                  </label>
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                    className="input-field" placeholder="Masukan alamat email" required autoComplete="email" />
                  {form.email && !emailValid && (
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle size={12} />
                      <span>Masukan email dengan benar</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Password
                  </label>
                  <div className="relative">
                    <input type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={e => update('password', e.target.value)}
                      className="input-field pr-10" placeholder="Buat password" required autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-muted)' }}
                      aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {form.password && !passwordLengthValid && (
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle size={12} />
                      <span>Password minimal 8 karakter, mengandung huruf kecil, huruf besar, angka dan simbol</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} value={form.confirm}
                      onChange={e => update('confirm', e.target.value)}
                      className="input-field pr-10" placeholder="Ulangi password" required autoComplete="new-password" />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'var(--text-muted)' }}
                      aria-label={showConfirm ? 'Sembunyikan password' : 'Tampilkan password'}>
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {form.confirm && !passwordMatch && (
                    <div className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle size={12} />
                      <span>Ulangi kata sandi</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Button Register */}
              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 gap-2 w-full md:w-auto"
                  style={{ padding: '0.75rem 2rem' }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} />
                      <span>Daftar Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="divider my-6">atau</div>

            <p className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
              Sudah punya akun?{' '}
              <Link href="/auth/login" className="font-semibold hover:underline transition-colors" style={{ color: 'var(--text)' }}>
                Masuk
              </Link>
            </p>
          </div>
        </div>
    </>
  );
}
