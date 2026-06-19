const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Manajemen Pemain",
    desc: "Daftarkan dan kelola data pemain secara terpusat. Pantau performa dan riwayat pertandingan setiap anggota.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
    title: "Turnamen Online",
    desc: "Buat dan kelola turnamen dengan sistem bracket otomatis. Dukung single elimination, round robin, dan lainnya.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Ranking & Poin",
    desc: "Sistem ranking otomatis berdasarkan poin dari setiap turnamen. Lihat klasemen langsung dan riwayat poin.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Jadwal Pertandingan",
    desc: "Kalender interaktif untuk melihat jadwal pertandingan. Notifikasi otomatis untuk pemain yang terdaftar.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Galeri Komunitas",
    desc: "Simpan dan tampilkan foto-foto kegiatan turnamen dan latihan. Bangun kenangan bersama komunitas.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Spin Wheel Live",
    desc: "Fitur undian baju live interaktif untuk menentukan lawan pertandingan secara adil dan menarik.",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-gray-50 dark:bg-gray-950 w-full py-24 lg:py-32">
      <div className="mx-auto w-11/12 px-4 md:w-4/5 lg:max-w-6xl xl:max-w-7xl">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
            Fitur Unggulan
          </span>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight md:text-4xl xl:text-5xl">
            Semua yang Anda Butuhkan
          </h2>
          <p className="mt-5 text-gray-600 dark:text-gray-400 text-base leading-relaxed max-w-2xl mx-auto">
            Platform lengkap untuk komunitas badminton — dari manajemen pemain hingga penyelenggaraan turnamen profesional.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 transition-all duration-500 hover:border-indigo-500/30 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
            >
              {/* Icon */}
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 transition-all duration-300 group-hover:border-indigo-500/40 group-hover:bg-indigo-500/15">
                {f.icon}
              </div>
              <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white">{f.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.desc}</p>

              {/* Hover glow */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: "radial-gradient(600px at 50% 0%, rgba(99,102,241,0.04), transparent)" }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
