import Link from "next/link";

export default function CTASection() {
  return (
    <section className="py-[var(--sp-section)] bg-[var(--ink)] text-white relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 md:px-8 xl:px-16 relative z-10 flex flex-col items-center text-center">
        <p className="text-white/60 text-xs font-ui font-semibold uppercase tracking-widest mb-4">
          Mari Bergabung
        </p>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-campaign mb-6 leading-tight max-w-3xl">
          SIAP UNTUK MEMULAI PERJALANAN BADMINTON ANDA?
        </h2>
        <p className="text-white/80 font-ui text-base md:text-lg mb-10 max-w-2xl">
          Bergabunglah dengan PB Prabu Bandung sekarang. Daftar gratis, ikuti turnamen, pantau ranking Anda, dan jadilah bagian dari komunitas kami yang luar biasa.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/auth/register" className="btn-secondary font-ui hover:scale-105 transition-transform duration-300">
            Daftar Sekarang
          </Link>
          <Link href="/tournaments" className="btn-outline-on-image font-ui !text-white !bg-transparent border border-white hover:!bg-white/10 transition-colors">
            Lihat Turnamen
          </Link>
        </div>
        
        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-white/60 font-ui">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-[var(--success-bright)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Pendaftaran Gratis</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-[var(--success-bright)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Tanpa Kartu Kredit</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-[var(--success-bright)]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Komunitas Aktif</span>
          </div>
        </div>
      </div>
    </section>
  );
}
