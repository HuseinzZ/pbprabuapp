import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galeri – PB Prabu Bandung",
};

const galleryAlbums = [
  { id: 1, title: "Open Tournament Seri A 2025", count: 32, emoji: "🏆", date: "Agustus 2025" },
  { id: 2, title: "Prabu Cup 2025", count: 48, emoji: "🥇", date: "Juni 2025" },
  { id: 3, title: "Latihan Rutin Q1 2026", count: 24, emoji: "🏸", date: "Maret 2026" },
  { id: 4, title: "Gala Dinner Komunitas", count: 18, emoji: "🌟", date: "Februari 2026" },
  { id: 5, title: "Spin Wheel Live 2025", count: 12, emoji: "🎯", date: "November 2025" },
  { id: 6, title: "Foto Tim 2024", count: 8, emoji: "👥", date: "Desember 2024" },
];

const featuredPhotos = [
  { emoji: "🏸", label: "Final Open Tournament", wide: true },
  { emoji: "🏆", label: "Penyerahan Piala" },
  { emoji: "👥", label: "Tim Juara" },
  { emoji: "🎯", label: "Aksi Servis" },
  { emoji: "💪", label: "Smash Point", wide: true },
  { emoji: "🥇", label: "Juara Pertama" },
];

export default function UserGalleryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Galeri Foto</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Foto-foto kegiatan komunitas PB Prabu Bandung.
        </p>
      </div>

      {/* Featured grid */}
      <section>
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Foto Pilihan</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {featuredPhotos.map((p, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-all duration-300 ${
                p.wide ? "col-span-2 md:col-span-2" : ""
              }`}
              style={{ aspectRatio: p.wide ? "16/7" : "4/3" }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl md:text-6xl mb-2 group-hover:scale-110 transition-transform duration-500">
                  {p.emoji}
                </span>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{p.label}</p>
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </section>

      {/* Albums */}
      <section>
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Album</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryAlbums.map((album) => (
            <button
              key={album.id}
              className="group flex items-center gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-left hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-200"
            >
              <div className="h-14 w-14 shrink-0 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                {album.emoji}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{album.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{album.count} foto · {album.date}</p>
              </div>
              <svg className="ml-auto h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
