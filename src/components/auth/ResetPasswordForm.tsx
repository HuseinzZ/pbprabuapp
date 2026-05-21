'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Loader2, Check, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import ComponentCard from '@/components/common/ComponentCard';
import Label from '@/components/form/Label';
import Input from '@/components/form/input/InputField';
import { EyeIcon, EyeCloseIcon } from '@/icons';
import Loader from '@/components/shared/Loader';

export default function ResetPasswordForm({ userId }: { userId?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [notif, setNotif] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const supabase = createClient();

  const isProcessing = loading || saving || navigating;

  function handleBack() {
    setNavigating(true);
    router.back();
  }

  useEffect(() => {
    async function checkUser() {
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();
      setLoading(false);
    }
    checkUser();
  }, [supabase, userId]);

  const passwordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  function showNotif(type: 'success' | 'error', message: string) {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 5000);
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setNotif(null);

    if (!passwordValid) {
      showNotif('error', 'Password minimal 8 karakter.');
      return;
    }

    if (!passwordsMatch) {
      showNotif('error', 'Password tidak cocok.');
      return;
    }

    setSaving(true);

    // Update password user yang sedang login
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      showNotif('error', error.message || 'Gagal mengubah password');
    } else {
      showNotif('success', 'Password berhasil diubah.');
      setPassword('');
      setConfirmPassword('');
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loader Overlay — only covers the card, not header/sidebar/footer */}
      {navigating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm rounded-2xl">
          <Loader />
        </div>
      )}
      <ComponentCard title="Ubah Password">
      {notif && (
        <div className={`mb-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-sm ${notif.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/40 dark:border-green-800 dark:text-green-200' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200'}`}>
          {notif.type === 'success' ? <CheckCircle2 size={16} className="flex-shrink-0" /> : <AlertCircle size={16} className="flex-shrink-0" />}
          <span>{notif.message}</span>
        </div>
      )}

      <form onSubmit={handleResetPassword} className="space-y-6">
        {/* New Password */}
        <div>
          <Label htmlFor="password">Password Baru</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e: any) => setPassword(e.target.value)}
              placeholder="Masukan password baru"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
            >
              {showPass ? (
                <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
              ) : (
                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
              )}
            </button>
          </div>
          {password && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${passwordValid ? 'bg-brand-500' : 'border border-gray-300 dark:border-gray-600'}`}>
                {passwordValid && <Check size={9} className="text-white" />}
              </div>
              <span className={passwordValid ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}>Minimal 8 karakter</span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPass ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e: any) => setConfirmPassword(e.target.value)}
              placeholder="Konfirmasi password baru"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
            >
              {showConfirmPass ? (
                <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
              ) : (
                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
              )}
            </button>
          </div>
          {confirmPassword && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${passwordsMatch ? 'bg-brand-500' : 'border border-gray-300 dark:border-gray-600'}`}>
                {passwordsMatch && <Check size={9} className="text-white" />}
              </div>
              <span className={passwordsMatch ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400'}>Password cocok</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={handleBack}
            disabled={isProcessing}
            className="flex flex-1 justify-center items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            {navigating ? (
              <><Loader2 size={16} className="animate-spin" /><span>Kembali...</span></>
            ) : (
              <><ArrowLeft size={16} /><span>Kembali</span></>
            )}
          </button>
          <button
            type="submit"
            disabled={isProcessing || !passwordValid || !passwordsMatch}
            className="flex flex-1 justify-center rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/20 disabled:opacity-50 gap-2 items-center"
          >
            {saving ? (
              <><Loader2 size={16} className="animate-spin" /><span>Menyimpan...</span></>
            ) : (
              <><ShieldCheck size={16} /><span>Simpan Password</span></>
            )}
          </button>
        </div>
      </form>
    </ComponentCard>
    </div>
  );
}
