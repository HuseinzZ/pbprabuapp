'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Eye, EyeOff, Loader2, UserPlus, Check } from 'lucide-react';
import { Loader } from '@/components/shared/Loader';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function RegisterPage() {
    const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const supabase = createClient();

    function update(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

    const rules = [
        { label: 'Minimal 8 karakter', ok: form.password.length >= 8 },
        { label: 'Huruf besar & kecil', ok: /[A-Z]/.test(form.password) && /[a-z]/.test(form.password) },
        { label: 'Angka', ok: /\d/.test(form.password) },
        { label: 'Password cocok', ok: form.password === form.confirm && form.confirm.length > 0 },
    ];

    const emailRules = [
        { label: 'Format email valid', ok: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) },
    ];

    async function handleRegister(e: React.FormEvent) {
        e.preventDefault();
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
        <div className="min-h-screen flex flex-col bg-pattern">
            <header className="flex items-center justify-end px-6 py-4 relative z-10">
                <ThemeToggle />
            </header>
            <main className="flex-1 flex items-center justify-center px-4 py-2">
                <div className="w-full max-w-[420px] animate-bounce-in">
                    <div className="card p-7 text-center">
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
                        <Link href="/login" className="btn-primary inline-flex items-center justify-center w-full" style={{ padding: '0.75rem' }}>
                            Ke Halaman Login
                        </Link>
                    </div>
                </div>
            </main>
            <footer className="flex flex-wrap items-center justify-center gap-1 pb-4 px-6 text-center">
                <p className="text-xs w-full text-center" style={{ color: 'var(--text-muted)' }}>
                    © {new Date().getFullYear()}{' '}
                    PB Prabu Bandung
                </p>
            </footer>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-pattern">
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

            {/* Top bar */}
            <header className="flex items-center justify-end px-6 py-4 relative z-10">
                <ThemeToggle />
            </header>

            {/* Loader */}
            {loading && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4 bg-white/10 p-8 rounded-2xl shadow-2xl">
                        <Loader />
                        <p className="text-sm font-medium animate-pulse text-white">
                            Memproses...
                        </p>
                    </div>
                </div>
            )}

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center px-4 py-2">
                <div className="w-full max-w-[420px] md:max-w-[700px] animate-fade-in">

                    {/* Card */}
                    <div className="card p-7 shadow-xl border border-white/10">
                        {/* Logo */}
                        <div className="flex flex-col items-center mb-6">
                            <Image src="/1.svg" alt="PB Prabu Bandung" width={64} height={64} priority />
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
                                        <div className="mt-2 grid grid-cols-1 gap-1">
                                            {emailRules.map(r => (
                                                <div key={r.label} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-green-600' : ''}`}
                                                    style={!r.ok ? { color: 'var(--text-muted)' } : {}}>
                                                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${r.ok ? 'bg-green-500' : ''}`}
                                                        style={!r.ok ? { border: '1px solid var(--border)' } : {}}>
                                                        {r.ok && <Check size={9} className="text-white" />}
                                                    </div>
                                                    {r.label}
                                                </div>
                                            ))}
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
                                        <div className="mt-2 grid grid-cols-1 gap-1">
                                            {rules.slice(0, 3).map(r => (
                                                <div key={r.label} className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-green-600' : ''}`}
                                                    style={!r.ok ? { color: 'var(--text-muted)' } : {}}>
                                                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${r.ok ? 'bg-green-500' : ''}`}
                                                        style={!r.ok ? { border: '1px solid var(--border)' } : {}}>
                                                        {r.ok && <Check size={9} className="text-white" />}
                                                    </div>
                                                    {r.label}
                                                </div>
                                            ))}
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
                                        <div className="mt-2 text-xs">
                                            {form.password === form.confirm ? (
                                                <span className="text-green-600 flex items-center gap-1.5">
                                                    <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 bg-green-500">
                                                        <Check size={9} className="text-white" />
                                                    </div>
                                                    Password cocok
                                                </span>
                                            ) : (
                                                <span className="text-red-500 flex items-center gap-1.5">
                                                    <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 border border-red-500">
                                                    </div>
                                                    Password tidak cocok
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Button Register */}
                            <div className="flex justify-center pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary w-fit px-8 justify-center"
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
                            <Link href="/login" className="font-semibold hover:underline transition-colors" style={{ color: 'var(--text)' }}>
                                Masuk
                            </Link>
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="flex flex-wrap items-center justify-center gap-1 pb-4 px-6 text-center">
                <p className="text-xs w-full text-center" style={{ color: 'var(--text-muted)' }}>
                    © {new Date().getFullYear()}{' '}
                    PB Prabu Bandung
                </p>
            </footer>
        </div>
    );
}
