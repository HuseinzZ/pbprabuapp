import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard – PB Prabu Bandung",
  description: "Dashboard anggota PB Prabu Bandung – pantau turnamen, ranking, dan jadwal Anda.",
};

const quickStats = [
  {
    label: "Turnamen Diikuti",
    value: "3",
    change: "+1 bulan ini",
    changeType: "positive",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
  },
  {
    label: "Total Poin",
    value: "1.240",
    change: "+180 poin",
    changeType: "positive",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    label: "Ranking",
    value: "#12",
    change: "Naik 3 posisi",
    changeType: "positive",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    label: "Pertandingan",
    value: "12",
    change: "8 Menang / 4 Kalah",
    changeType: "neutral",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/20",
  },
];

const upcomingMatches = [
  {
    opponent: "Budi Raharjo",
    tournament: "Open Tournament Seri A",
    date: "15 Juli 2026",
    time: "09:00 WIB",
    court: "Lapangan 2",
    category: "Ganda Putra",
  },
  {
    opponent: "Ahmad Sulaiman",
    tournament: "Prabu Cup Seri B",
    date: "22 Juli 2026",
    time: "14:00 WIB",
    court: "Lapangan 1",
    category: "Tunggal Putra",
  },
];

const recentResults = [
  { opponent: "Deni Kusuma", result: "Menang", score: "21-15, 21-18", tournament: "Prabu Cup Seri A" },
  { opponent: "Reza Pratama", result: "Menang", score: "21-19, 18-21, 21-17", tournament: "Open Tournament" },
  { opponent: "Hendra S.", result: "Kalah", score: "15-21, 12-21", tournament: "Prabu Cup Seri A" },
];

const activeTournaments = [
  {
    name: "Open Tournament Seri A",
    category: "Ganda Putra",
    status: "Perempat Final",
    statusBg: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400",
    progress: 75,
  },
  {
    name: "Prabu Cup Seri B",
    category: "Tunggal Putra",
    status: "Babak 16 Besar",
    statusBg: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
    progress: 50,
  },
];

export default function UserDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Selamat Datang! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Pantau aktivitas turnamen dan performa Anda di PB Prabu Bandung.
          </p>
        </div>
        <Link
          href="/user/tournaments"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Daftar Turnamen
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 transition-shadow hover:shadow-md"
          >
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color} mb-3`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
            <p
              className={`text-xs mt-1 font-medium ${
                stat.changeType === "positive"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {stat.changeType === "positive" && "↑ "}
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming Matches */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Jadwal Pertandingan Berikutnya</h2>
            <Link href="/user/matches" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              Lihat semua
            </Link>
          </div>
          {upcomingMatches.length > 0 ? (
            <div className="space-y-3">
              {upcomingMatches.map((m, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-400">
                        {m.category}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      vs{" "}
                      <span className="text-indigo-600 dark:text-indigo-400">{m.opponent}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{m.tournament}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{m.date}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{m.time} · {m.court}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
              Belum ada jadwal pertandingan.
            </p>
          )}
        </div>

        {/* Recent Results */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Hasil Terakhir</h2>
            <Link href="/user/matches" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
              Lihat semua
            </Link>
          </div>
          <div className="space-y-3">
            {recentResults.map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-flex h-6 w-16 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                    r.result === "Menang"
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      : "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                  }`}
                >
                  {r.result}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">vs {r.opponent}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{r.score}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{r.tournament}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Tournaments */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Turnamen yang Sedang Diikuti</h2>
          <Link href="/user/tournaments" className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
            Lihat semua
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {activeTournaments.map((t, i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.category}</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${t.statusBg}`}>
                  {t.status}
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  <span>Progres</span>
                  <span>{t.progress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-1.5 rounded-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${t.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
