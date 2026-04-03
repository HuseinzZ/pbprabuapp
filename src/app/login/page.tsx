'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { Loader } from '@/components/shared/Loader';
import { toast } from 'react-toastify';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();

        let isValid = true;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            setEmailError('Email tidak boleh kosong');
            isValid = false;
        } else if (!emailRegex.test(email)) {
            setEmailError('Format email tidak valid');
            isValid = false;
        } else {
            setEmailError('');
        }

        if (!password) {
            setPasswordError('Password tidak boleh kosong');
            isValid = false;
        } else if (password.length < 8) {
            setPasswordError('Password wajib minimal 8 karakter');
            isValid = false;
        } else {
            setPasswordError('');
        }

        if (!isValid) return;

        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            toast.error(error.message === 'Invalid login credentials' ? 'Email atau password salah' : error.message);
            setLoading(false);
            return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            toast.success('Berhasil masuk!');
            router.push(profile?.role === 'admin' ? '/admin' : '/');
            router.refresh();
        }
        setLoading(false);
    }

    return (
        <div className="min-h-screen flex flex-col bg-pattern">

            {/* Top bar */}
            <header className="flex items-center justify-end px-6 py-4 relative z-10">
                <ThemeToggle />
            </header>

            {/* Loader */}
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-4">
                        <Loader />
                        <p className="text-sm font-medium animate-pulse" style={{ color: 'var(--text)' }}>
                            Memproses...
                        </p>
                    </div>
                </div>
            )}

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center px-4 py-2">
                <div className="w-full max-w-[420px] animate-fade-in">

                    {/* Card */}
                    <div className="card p-7">
                        {/* Logo */}
                        <div className="flex flex-col items-center mb-6">
                            <Image
                                src="/1.svg"
                                alt="PB Prabu Bandung"
                                width={64}
                                height={64}
                                priority
                            />
                            <h2
                                className="font-display font-bold text-lg mt-3"
                                style={{ color: 'var(--text)' }}
                            >
                                Masuk ke Akun Anda
                            </h2>
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
                                    onChange={e => {
                                        const val = e.target.value;
                                        setEmail(val);
                                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                        if (val.length > 0 && !emailRegex.test(val)) {
                                            setEmailError('Format email tidak valid');
                                        } else {
                                            setEmailError('');
                                        }
                                    }}
                                    className={`input-field ${emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                    placeholder="Masukan alamat email anda"
                                    required
                                    autoComplete="email"
                                />
                                {emailError && <p className="text-red-500 text-xs mt-1.5">{emailError}</p>}
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label
                                        htmlFor="password"
                                        className="text-xs font-semibold uppercase tracking-wider"
                                        style={{ color: 'var(--text-secondary)' }}
                                    >
                                        Password
                                    </label>
                                </div>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setPassword(val);
                                            if (val.length > 0 && val.length < 8) {
                                                setPasswordError('Password wajib minimal 8 karakter');
                                            } else {
                                                setPasswordError('');
                                            }
                                        }}
                                        className={`input-field pr-10 ${passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
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
                                {passwordError && <p className="text-red-500 text-xs mt-1.5">{passwordError}</p>}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full justify-center mt-2"
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
                                href="/register"
                                className="font-semibold hover:underline transition-colors"
                                style={{ color: 'var(--text)' }}
                            >
                                Daftar sekarang
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
