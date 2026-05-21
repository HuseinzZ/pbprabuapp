import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import React from 'react';
import { Users2, Trophy, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard Admin | PB Prabu',
  description: 'Ringkasan data PB Prabu Bandung',
};

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch counts secara asinkron menggunakan Promise.all untuk paralelisme
  const [
    { count: countUsers },
    { count: countPlayers },
    { count: countTournaments },
    { count: countMatches }
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('players').select('*', { count: 'exact', head: true }),
    supabase.from('tournaments').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true })
  ]);

  // Pemetaan manual untuk menghindari dynamic class pada Tailwind CSS
  const stats = [
    { label: 'Total User (Akun)', value: countUsers || 0, icon: Users, bgColorLight: 'bg-blue-50', textLight: 'text-blue-600', bgDark: 'dark:bg-blue-500/10', textDark: 'dark:text-blue-400' },
    { label: 'Total Pemain (Registrasi)', value: countPlayers || 0, icon: Users2, bgColorLight: 'bg-orange-50', textLight: 'text-orange-600', bgDark: 'dark:bg-orange-500/10', textDark: 'dark:text-orange-400' },
    { label: 'Turnamen (Total)', value: countTournaments || 0, icon: Trophy, bgColorLight: 'bg-green-50', textLight: 'text-green-600', bgDark: 'dark:bg-green-500/10', textDark: 'dark:text-green-400' },
    { label: 'Pertandingan Dimainkan', value: countMatches || 0, icon: Trophy, bgColorLight: 'bg-purple-50', textLight: 'text-purple-600', bgDark: 'dark:bg-purple-500/10', textDark: 'dark:text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Ringkasan statistik real-time dari database Supabase Anda.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_4px_20px_0_rgba(0,0,0,0.03)] dark:shadow-none flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <h3 className="text-3xl font-bold mt-3 text-gray-900 dark:text-white">{stat.value}</h3>
                </div>
                <div className={`p-3.5 ${stat.bgColorLight} ${stat.bgDark} ${stat.textLight} ${stat.textDark} rounded-xl`}>
                  <Icon size={24} strokeWidth={2} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4">Statistik Database Tersambung</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
            Semua metrik di atas dihitung dengan query ringan (head: true) yang ditarik langsung (real-time) melalui server-side rendering pada Next.js ke database Supabase PB Prabu Anda.
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-center">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4">Navigasi Admin</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            Gunakan sidebar di sebelah kiri untuk masuk ke menu Manajemen User (merender tabel <code className="text-red-500">profiles</code>), Manajemen Pemain (merender tabel <code className="text-red-500">players</code>), dan seterusnya. Jika ingin membuat CRUD, disarankan untuk memisahkan rute-rutenya sesuai kaidah App Router (seperti `/admin/profiles/page.tsx`).
          </p>
        </div>
      </div>
    </div>
  );
}
