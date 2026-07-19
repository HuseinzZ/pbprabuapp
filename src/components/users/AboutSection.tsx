import Link from "next/link";

const stats = [
  { value: "50+", label: "Pemain Terdaftar" },
  { value: "50+", label: "Turnamen Digelar" },
  { value: "1.000+", label: "Pertandingan" },
  { value: "5+", label: "Tahun Berdiri" },
];

const values = [
  { icon: "🏸", title: "Kompetitif", desc: "Mendorong setiap pemain untuk tampil terbaik di setiap pertandingan." },
  { icon: "🤝", title: "Komunitas", desc: "Membangun ikatan kuat antara pemain, pelatih, dan pendukung." },
  { icon: "🏆", title: "Berprestasi", desc: "Mencetak atlet-atlet berbakat yang bersaing di tingkat nasional." },
];

export default function AboutSection() {
  return (
    <section id="about" aria-label="Tentang Kami" className="bg-gray-50 dark:bg-gray-900 w-full pt-24 md:pt-32 pb-16 md:pb-24">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8 xl:px-16">

        {/* ── Page Header ── */}
        <div className="mb-12 max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
            Tentang Kami
          </h1>
          <p className="text-slate-600 dark:text-zinc-400 text-sm leading-relaxed">
            Pelajari lebih lanjut tentang visi, misi, dan perjalanan komunitas PB Prabu Bandung.
          </p>
        </div>

        {/* ── Hero block ── */}
        <div className="flex flex-col lg:flex-row items-start gap-16 lg:gap-24 mb-16 md:mb-24">
          {/* Text column */}
          <div className="flex-1">
            <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg leading-relaxed mb-4">
              PB Prabu Bandung adalah klub badminton yang telah berdiri selama lebih dari 5 tahun di Bandung.
              Kami berkomitmen untuk mengembangkan bakat pemain di semua level, mulai dari pemula hingga atlet kompetitif.
            </p>
            <p className="text-slate-600 dark:text-slate-300 text-base md:text-lg leading-relaxed mb-10">
              Dengan platform digital ini, kami menyatukan seluruh ekosistem komunitas, manajemen pemain,
              penyelenggaraan turnamen, dan dokumentasi perjalanan bersama dalam satu portal yang modern.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Link href="/auth/register" className="bg-brand-600 hover:bg-brand-500 text-white font-bold !rounded-full px-8 py-3 transition-colors shadow-sm w-full sm:w-auto text-center">
                Bergabung Sekarang
              </Link>
              <Link href="/tournaments" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 font-bold !rounded-full px-8 py-3 transition-colors shadow-sm w-full sm:w-auto text-center">
                Lihat Turnamen
              </Link>
            </div>
          </div>

          {/* Stats column */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`relative border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 p-6 rounded-2xl overflow-hidden shadow-sm ${i % 2 === 1 ? "mt-6" : ""}`}
                >
                  {/* Left accent bar */}
                  <div className="absolute top-0 left-0 h-full w-[4px] bg-brand-500" />
                  <div className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2 pl-2">
                    {s.value}
                  </div>
                  <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 pl-2">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Visi & Misi ── */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-16 md:pt-24 mb-8 md:mb-12">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Visi */}
            <div className="flex-1 p-8 md:p-10 rounded-3xl bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 text-9xl opacity-[0.03] dark:opacity-[0.02] transform group-hover:scale-110 transition-transform duration-500">
                👁️
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4 relative z-10">VISI</h3>
              <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed relative z-10">
                Menjadi komunitas badminton terdepan di Bandung yang tidak hanya berfokus pada prestasi olahraga, tetapi juga membangun gaya hidup sehat, solidaritas, dan persaudaraan yang erat antar pecinta bulu tangkis dari berbagai kalangan.
              </p>
            </div>

            {/* Misi */}
            <div className="flex-1 p-8 md:p-10 rounded-3xl bg-brand-500 border border-brand-400 shadow-lg hover:shadow-brand-500/30 transition-shadow relative overflow-hidden group">
              <div className="absolute -bottom-10 -right-6 text-9xl opacity-[0.08] transform group-hover:-translate-y-4 transition-transform duration-500">
                🎯
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-5 relative z-10">MISI</h3>
              <ul className="text-white/95 text-base leading-relaxed space-y-3 relative z-10 list-inside">
                <li className="flex gap-3 items-start">
                  <span className="text-brand-200 mt-1">✦</span>
                  <span>Menyelenggarakan sesi latihan rutin yang berkualitas untuk semua tingkat keahlian secara konsisten.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-brand-200 mt-1">✦</span>
                  <span>Mengadakan turnamen kompetitif berkala untuk mengasah mental bertanding dan sportivitas anggota.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-brand-200 mt-1">✦</span>
                  <span>Membangun ekosistem olahraga yang inklusif, ramah, serta menjadi rumah kedua bagi setiap anggota.</span>
                </li>
                <li className="flex gap-3 items-start">
                  <span className="text-brand-200 mt-1">✦</span>
                  <span>Menjaring dan membina potensi-potensi pemain berbakat untuk dapat berprestasi di tingkat yang lebih tinggi.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
