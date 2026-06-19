import Link from "next/link";

const tournaments = [
  {
    id: 1,
    name: "Open Tournament Seri A",
    category: "Ganda Putra / Ganda Putri",
    status: "Pendaftaran Dibuka",
    statusColor: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    date: "15 Juli 2026",
    participants: "32 Pasang",
    prize: "Piala + Sertifikat",
    icon: "🏆",
  },
  {
    id: 2,
    name: "Prabu Cup Seri B",
    category: "Tunggal Putra / Tunggal Putri",
    status: "Segera Dimulai",
    statusColor: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    date: "22 Juli 2026",
    participants: "64 Pemain",
    prize: "Uang Tunai + Piala",
    icon: "🥇",
  },
  {
    id: 3,
    name: "Ganda Campuran Prabu",
    category: "Ganda Campuran",
    status: "Sedang Berlangsung",
    statusColor: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
    date: "10 Juni 2026",
    participants: "24 Pasang",
    prize: "Piala Kejuaraan",
    icon: "🎯",
  },
];

export default function TournamentsSection() {
  return (
    <section id="tournaments" className="bg-white dark:bg-gray-900 w-full py-24 lg:py-32">
      <div className="mx-auto w-11/12 px-4 md:w-4/5 lg:max-w-6xl xl:max-w-7xl">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
              Turnamen
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight md:text-4xl">
              Turnamen Aktif & Mendatang
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base mt-3 max-w-xl">
              Daftar turnamen yang sedang berjalan dan yang akan datang. Bergabunglah dan tunjukkan kemampuan terbaik Anda!
            </p>
          </div>
          <Link
            href="/auth/login"
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white text-sm font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition"
          >
            Lihat Semua
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="group relative flex flex-col rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 transition-all duration-500 hover:border-indigo-500/25 hover:bg-white/[0.05]"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{t.icon}</div>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${t.statusColor}`}
                >
                  {t.status}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{t.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">{t.category}</p>

              <div className="flex flex-col gap-2 text-xs text-gray-500 mb-6">
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{t.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{t.participants}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                  <span>{t.prize}</span>
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/auth/register"
                className="mt-auto flex h-10 items-center justify-center rounded-xl bg-indigo-600/80 text-sm font-semibold text-gray-900 dark:text-white transition-all duration-200 hover:bg-indigo-600 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              >
                Daftar Turnamen
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
