import Link from "next/link";

export default function CTASection() {
  return (
    <section className="relative bg-gray-50 dark:bg-gray-950 flex w-full justify-center py-24 lg:py-32 overflow-hidden">
      {/* Radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto w-11/12 px-4 md:w-4/5 lg:max-w-4xl text-center">
        <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
          Bergabung Sekarang
        </span>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight md:text-4xl xl:text-5xl mb-6">
          Siap Bergabung dengan Komunitas?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-10 max-w-2xl mx-auto">
          Daftar gratis dan mulai ikuti turnamen, pantau ranking, serta nikmati semua fitur platform PB Prabu Bandung.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          <Link
            href="/auth/register"
            id="cta-bottom-register"
            className="flex h-12 w-60 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-gray-900 dark:text-white transition-all duration-300 hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]"
          >
            Daftar Gratis
          </Link>
          <Link
            href="/auth/login"
            className="flex h-12 w-60 items-center justify-center rounded-xl border border-gray-300 dark:border-white/20 text-sm font-bold text-gray-900 dark:text-white transition-all duration-300 hover:bg-gray-100 dark:hover:bg-white/5 hover:border-white/30"
          >
            Sudah Punya Akun? Masuk
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Pendaftaran Gratis</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Tanpa Kartu Kredit</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Komunitas Aktif</span>
          </div>
        </div>
      </div>
    </section>
  );
}
