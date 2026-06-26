'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Loader2, Check, AlertCircle, CheckCircle2, ArrowLeft, Save } from 'lucide-react';
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const supabase = createClient();

  const isProcessing = loading || saving || navigating;

  function handleBack() {
    setNavigating(true);
    router.back();
  }

  useEffect(() => {
    // Tidak perlu query DB — cukup pastikan session aktif
    setLoading(false);
  }, []);

  function showNotif(type: 'success' | 'error', message: string) {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 4000);
  }

  function validateField(name: string, val1: string, val2: string) {
    let error = "";
    if (name === "password") {
      if (!val1) error = "Password wajib diisi";
      else if (val1.length < 8) error = "Password minimal 8 karakter";
    } else if (name === "confirmPassword") {
      if (!val2) error = "Konfirmasi password wajib diisi";
      else if (val1 !== val2) error = "Password tidak cocok";
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error;
  }

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    validateField("password", val, confirmPassword);
    if (confirmPassword) validateField("confirmPassword", val, confirmPassword);
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    validateField("confirmPassword", password, val);
  };

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setNotif(null);

    const errPass = validateField("password", password, confirmPassword);
    const errConf = validateField("confirmPassword", password, confirmPassword);

    if (errPass || errConf) {
      showNotif('error', 'Mohon perbaiki kesalahan pada formulir');
      return;
    }

    setSaving(true);

    if (userId) {
      // Jika userId ada, gunakan API admin untuk update password user lain
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, password: password }),
      });
      const result = await res.json();
      if (!res.ok) {
        showNotif('error', result.error || 'Gagal mengubah password');
      } else {
        showNotif('success', 'Password berhasil diubah.');
        setPassword('');
        setConfirmPassword('');
      }
    } else {
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
      {/* {navigating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm rounded-2xl">
          <Loader />
        </div>
      )} */}
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
              onChange={(e: any) => handlePasswordChange(e.target.value)}
              placeholder="Masukan password baru"
              error={!!errors.password}
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
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
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
              onChange={(e: any) => handleConfirmPasswordChange(e.target.value)}
              placeholder="Konfirmasi password baru"
              error={!!errors.confirmPassword}
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
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
          )}
        </div>

        <div className="flex justify-between gap-3 pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={handleBack}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>
          <button
            type="submit"
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-sm"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
            ) : (
              <><Save className="w-4 h-4" /> Simpan</>
            )}
          </button>
        </div>
      </form>
    </ComponentCard>
    </div>
  );
}
