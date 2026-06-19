import Link from "next/link";

const stats = [
  { value: "200+", label: "Pemain Terdaftar" },
  { value: "50+", label: "Turnamen Digelar" },
  { value: "1.000+", label: "Pertandingan" },
  { value: "5+", label: "Tahun Berdiri" },
];

export default function AboutSection() {
  return (
    <section id="about" className="bg-gray-50 dark:bg-gray-950 w-full py-24 lg:py-32">
      <div className="mx-auto w-11/12 px-4 md:w-4/5 lg:max-w-6xl xl:max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Text column */}
          <div className="flex-1">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
              Tentang Kami
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight md:text-4xl xl:text-5xl mb-6 leading-[1.15]">
              Komunitas Badminton yang{" "}
              <span className="text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #a5b4fc, #6366f1)", WebkitBackgroundClip: "text", backgroundClip: "text" }}>
                Solid & Berprestasi
              </span>
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-6">
              PB Prabu Bandung adalah klub badminton yang telah berdiri selama lebih dari 5 tahun di Bandung.
              Kami berkomitmen untuk mengembangkan bakat pemain di semua level, mulai dari pemula
              hingga atlet kompetitif.
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-10">
              Dengan platform digital ini, kami menyatukan seluruh ekosistem komunitas — manajemen pemain,
              penyelenggaraan turnamen, dan dokumentasi perjalanan bersama — dalam satu portal yang modern dan mudah digunakan.
            </p>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-gray-900 dark:text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
            >
              Bergabung Sekarang
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Stats column */}
          <div className="flex-1 w-full">
            <div className="grid grid-cols-2 gap-5">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`relative rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 overflow-hidden group hover:border-indigo-500/30 transition-all duration-500 ${
                    i === 1 ? "mt-6" : i === 3 ? "mt-6" : ""
                  }`}
                >
                  {/* Dot accent */}
                  <div
                    className="absolute top-0 left-0 h-full w-[3px] rounded-full"
                    style={{
                      background: "linear-gradient(180deg, rgba(99,102,241,0.8) 0%, rgba(99,102,241,0) 100%)",
                    }}
                  />
                  <div
                    className="absolute top-0 -left-1 h-3 w-3 rounded-full bg-indigo-500 animate-pulse"
                  />
                  <div className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2 pl-2">{s.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 pl-2">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
