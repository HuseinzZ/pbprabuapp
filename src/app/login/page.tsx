'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { Eye, EyeOff, ShieldCheck, Loader2, Check, X, AlertCircle, CheckCircle2, MailWarning } from 'lucide-react';
import { Loader } from '@/components/shared/Loader';

// Tipe notifikasi
type NotifType = 'success' | 'error' | 'warning' | null;

interface Notif {
    type: NotifType;
    message: string;
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notif, setNotif] = useState<Notif | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const emailRules = [
        { label: 'Format email valid', ok: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) },
    ];
    const passwordRules = [
        { label: 'Minimal 8 karakter', ok: password.length >= 8 },
    ];

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
            showNotif('success', 'Berhasil masuk! Mengalihkan...');
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
        <div className="min-h-screen flex flex-col bg-pattern">

            {/* Top bar */}
            <header className="flex items-center justify-end px-6 py-4 relative z-10">
                <ThemeToggle />
            </header>

            {/* Loader overlay */}
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
                            <Image src="/1.svg" alt="PB Prabu Bandung" width={64} height={64} priority />
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
                                {email && (
                                    <div className="mt-2 grid grid-cols-1 gap-1">
                                        {emailRules.map(r => (
                                            <div key={r.label}
                                                className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-green-600' : ''}`}
                                                style={!r.ok ? { color: 'var(--text-muted)' } : {}}>
                                                <div
                                                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${r.ok ? 'bg-green-500' : ''}`}
                                                    style={!r.ok ? { border: '1px solid var(--border)' } : {}}>
                                                    {r.ok && <Check size={9} className="text-white" />}
                                                </div>
                                                {r.label}
                                            </div>
                                        ))}
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
                                {password && (
                                    <div className="mt-2 grid grid-cols-1 gap-1">
                                        {passwordRules.map(r => (
                                            <div key={r.label}
                                                className={`flex items-center gap-1.5 text-xs ${r.ok ? 'text-green-600' : ''}`}
                                                style={!r.ok ? { color: 'var(--text-muted)' } : {}}>
                                                <div
                                                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${r.ok ? 'bg-green-500' : ''}`}
                                                    style={!r.ok ? { border: '1px solid var(--border)' } : {}}>
                                                    {r.ok && <Check size={9} className="text-white" />}
                                                </div>
                                                {r.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
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
                    © {new Date().getFullYear()} PB Prabu Bandung
                </p>
            </footer>
        </div>
    );
}