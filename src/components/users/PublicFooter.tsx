import Link from "next/link";

const footerSections = [
  {
    title: "Portal",
    links: [
      { label: "Beranda", href: "/" },
      { label: "Rankings", href: "/rankings" },
      { label: "Turnamen", href: "/tournaments" },
      { label: "Jadwal Pertandingan", href: "/matches" },
    ],
  },
  {
    title: "Komunitas",
    links: [
      { label: "Kalender", href: "/calendar" },
      { label: "Galeri", href: "/gallery" },
      { label: "Spin Wheel", href: "/spin-wheel" },
      { label: "Tentang Kami", href: "/about" },
    ],
  },
  {
    title: "Akun",
    links: [
      { label: "Masuk", href: "/auth/login" },
      { label: "Daftar", href: "/auth/register" },
      { label: "Profil", href: "/user/profile" },
    ],
  },
];


const socialLinks = [
  {
    label: "WhatsApp",
    href: "https://wa.me/6287831704538",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.031 0C5.385 0 0 5.383 0 12.029c0 2.12.553 4.195 1.603 6.015L.32 23.498l5.59-1.464a11.967 11.967 0 006.12 1.684h.003c6.645 0 12.03-5.385 12.03-12.029 0-3.22-1.254-6.248-3.53-8.525A12.008 12.008 0 0012.031 0zm.003 21.718h-.002a10.003 10.003 0 01-5.12-1.404l-.367-.218-3.805.997 1.018-3.71-.24-.38a10.015 10.015 0 01-1.53-5.35c0-5.545 4.512-10.058 10.056-10.058 2.686 0 5.209 1.047 7.106 2.946 1.899 1.898 2.943 4.422 2.943 7.109-.001 5.546-4.513 10.058-10.059 10.058zm5.509-7.53c-.302-.15-1.791-.884-2.068-.985-.276-.1-.478-.15-.679.15-.201.3-.781.985-.957 1.185-.175.2-.352.226-.653.076-.302-.15-1.278-.47-2.435-1.503-.902-.805-1.51-1.8-1.686-2.1-.175-.302-.018-.466.133-.615.136-.134.302-.352.453-.528.15-.175.2-.302.301-.502.1-.2.05-.376-.025-.526-.075-.15-.679-1.637-.93-2.241-.243-.589-.489-.508-.679-.517-.175-.008-.377-.01-.578-.01-.2 0-.528.075-.805.376-.276.3-.1055 1.178-.1055 2.883 0 1.704.108 3.356 1.232 4.856 1.124 1.5 3.064 4.672 7.425 6.55 1.037.447 1.846.714 2.476.914 1.04.331 1.988.283 2.735.172.835-.125 2.564-1.048 2.923-2.06.36-1.011.36-1.879.252-2.06-.108-.182-.384-.282-.686-.432z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/pb_prabubdg?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@PBPrabuBandung/featured",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
      </svg>
    ),
  },
];

export default function PublicFooter() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800" aria-label="Site footer">
      <div className="mx-auto w-11/12 px-4 md:w-4/5 lg:max-w-6xl xl:max-w-7xl py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
          {/* Brand col */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src="/1.png" alt="PB Prabu Logo" className="h-10 w-auto" />
              <span className="text-gray-900 dark:text-white font-bold text-lg">PB Prabu Bandung</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
              Portal resmi komunitas badminton PB Prabu Bandung – turnamen, ranking, jadwal, dan galeri.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-white/15 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-indigo-500 hover:bg-indigo-600/10 transition-all duration-200"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link cols */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-gray-900 dark:text-white font-bold text-sm uppercase tracking-wider mb-5">{section.title}</h3>
              <ul className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} PB Prabu Bandung. Semua hak dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
