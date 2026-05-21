'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Loader2, UserPlus, Check } from 'lucide-react';
import Loader from '@/components/shared/Loader';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function SignUpForm() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const supabase = createClient();

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const passwordLengthValid = form.password.length >= 8;
  const passwordMatch = form.password === form.confirm && form.confirm.length > 0;

  function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!form.full_name) { toast.error('Nama Lengkap tidak boleh kosong'); return; }
    if (!form.email) { toast.error('Email tidak boleh kosong'); return; }
    if (!emailRegex.test(form.email)) { toast.error('Format email tidak valid'); return; }
    if (form.password !== form.confirm) { toast.error('Password tidak cocok'); return; }
    if (form.password.length < 8) { toast.error('Password minimal 8 karakter'); return; }
    
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.full_name, role: 'user' } },
    });
    if (error) { toast.error(error.message); setLoading(false); return; }
    toast.success('Pendaftaran berhasil!');
    setDone(true);
    setLoading(false);
  }

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
      {/* Notifikasi Container */}
      <ToastContainer
        position="top-center"
        limit={3}
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        draggable
        pauseOnHover
      />

      {loading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm">
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
                  {form.email && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${emailValid ? 'bg-green-500' : 'border border-[var(--border)]'}`}>
                        {emailValid && <Check size={9} className="text-white" />}
                      </div>
                      <span className={emailValid ? 'text-green-600' : 'text-[var(--text-muted)]'}>Format email valid</span>
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
                  {form.password && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${passwordLengthValid ? 'bg-green-500' : 'border border-[var(--border)]'}`}>
                        {passwordLengthValid && <Check size={9} className="text-white" />}
                      </div>
                      <span className={passwordLengthValid ? 'text-green-600' : 'text-[var(--text-muted)]'}>Minimal 8 karakter</span>
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
                  {form.confirm && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${passwordMatch ? 'bg-green-500' : 'border border-[var(--border)]'}`}>
                        {passwordMatch && <Check size={9} className="text-white" />}
                      </div>
                      <span className={passwordMatch ? 'text-green-600' : 'text-[var(--text-muted)]'}>Password cocok</span>
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
