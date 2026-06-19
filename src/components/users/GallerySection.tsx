const galleryItems = [
  { id: 1, emoji: "🏸", label: "Pertandingan Final", desc: "Open Tournament Seri A 2025", wide: true },
  { id: 2, emoji: "🏆", label: "Penyerahan Piala", desc: "Prabu Cup 2025" },
  { id: 3, emoji: "👥", label: "Foto Tim", desc: "Latihan Rutin" },
  { id: 4, emoji: "🎯", label: "Spin Wheel Live", desc: "Undian Peserta" },
  { id: 5, emoji: "📸", label: "Aksi Pemain", desc: "Turnamen Ganda Campuran", wide: true },
  { id: 6, emoji: "🌟", label: "Juara Baru", desc: "Prabu Cup 2024" },
];

export default function GallerySection() {
  return (
    <section id="gallery" className="bg-gray-50 dark:bg-gray-950 w-full py-24 lg:py-32">
      <div className="mx-auto w-11/12 px-4 md:w-4/5 lg:max-w-6xl xl:max-w-7xl">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">
            Galeri
          </span>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight md:text-4xl xl:text-5xl">
            Momen Berharga Komunitas
          </h2>
          <p className="mt-5 text-gray-600 dark:text-gray-400 text-base leading-relaxed max-w-xl mx-auto">
            Kumpulan foto-foto kegiatan turnamen, latihan, dan momen spesial komunitas PB Prabu Bandung.
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {galleryItems.map((item) => (
            <div
              key={item.id}
              className={`group relative overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-500 hover:border-indigo-500/30 ${
                item.wide ? "col-span-2 md:col-span-2" : ""
              }`}
              style={{ aspectRatio: item.wide ? "16/7" : "4/3" }}
            >
              {/* Placeholder background */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(30,31,40,1) 0%, rgba(20,21,30,1) 100%)",
                }}
              >
                <span className="text-5xl md:text-7xl mb-3 group-hover:scale-110 transition-transform duration-500">
                  {item.emoji}
                </span>
                <p className="text-gray-900 dark:text-white font-semibold text-sm md:text-base">{item.label}</p>
                <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
              </div>

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-all duration-500 rounded-2xl" />

              {/* Bottom gradient */}
              <div
                className="absolute bottom-0 left-0 right-0 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background:
                    "linear-gradient(to top, rgba(30,31,35,0.8) 0%, transparent 100%)",
                }}
              />
            </div>
          ))}
        </div>

        {/* Load more */}
        <div className="text-center mt-10">
          <a
            href="/auth/login"
            className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white text-sm font-semibold rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 hover:border-white/30 transition-all duration-200"
          >
            Lihat Semua Foto
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
