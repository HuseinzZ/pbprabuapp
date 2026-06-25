"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import UserDropdown from "@/components/header/UserDropdown";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";

const navLinks = [
  { label: "Beranda", href: "/" },
  { label: "Rankings", href: "/rankings" },
  { label: "Turnamen", href: "/tournaments" },
  { label: "Jadwal", href: "/matches" },
  { label: "Kalender", href: "/calendar" },
  { label: "Galeri", href: "/gallery" },
  { label: "Spin Wheel", href: "/spin-wheel" },
  { label: "Tentang", href: "/about" },
];

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Auth check
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSessionUser(session?.user || null);
      setLoading(false);
    };
    fetchSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user || null);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const isAtHome = pathname === "/";

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="fixed top-0 left-0 right-0 z-[999] transition-all duration-300 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm"
      >
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 xl:px-16 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0"
            aria-label="PB Prabu Bandung"
          >
            <Image
              src="/1.png"
              alt="PB Prabu Logo"
              width={40}
              height={40}
              priority
              style={{ width: "auto", height: "40px" }}
            />
            <span
              className="font-bold text-[15px] hidden sm:block tracking-tight transition-colors duration-300 text-gray-900 dark:text-white"
            >
              PB Prabu Bandung
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative px-3.5 py-2 text-[13px] font-medium tracking-tight transition-colors duration-200 font-ui ${
                    isActive
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {link.label}
                  {/* Active underline per DESIGN.md primary-nav spec */}
                  <span
                    className={`absolute bottom-0 left-3.5 right-3.5 h-[2px] transition-transform duration-300 origin-left bg-gray-900 dark:bg-white ${
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Desktop actions */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="border-r pr-3 border-gray-200 dark:border-gray-700">
              <ThemeToggleButton />
            </div>

            {!loading && (
              sessionUser ? (
                <div className="scale-90 origin-right">
                  <UserDropdown />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="px-4 py-2 text-[13px] font-medium font-ui rounded-full transition-colors text-gray-900 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/auth/register"
                    className="btn-primary !h-[38px] !py-0 !px-5 !text-[13px]"
                    id="nav-register-btn"
                  >
                    Daftar
                  </Link>
                </div>
              )
            )}
          </div>

          {/* Mobile controls */}
          <div className="lg:hidden flex items-center gap-2">
            <ThemeToggleButton />
            <button
              className="flex flex-col gap-[5px] p-2 rounded-lg transition hover:bg-gray-100 dark:hover:bg-white/10"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <span
                className={`block h-[1.5px] w-5 transition-all duration-300 bg-gray-900 dark:bg-gray-200 ${menuOpen ? "rotate-45 translate-y-[6.5px]" : ""}`}
              />
              <span
                className={`block h-[1.5px] w-5 transition-all duration-300 bg-gray-900 dark:bg-gray-200 ${menuOpen ? "opacity-0" : ""}`}
              />
              <span
                className={`block h-[1.5px] w-5 transition-all duration-300 bg-gray-900 dark:bg-gray-200 ${menuOpen ? "-rotate-45 -translate-y-[6.5px]" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div
          id="mobile-menu"
          role="dialog"
          aria-label="Mobile navigation menu"
          className={`absolute top-16 left-0 right-0 bg-white/98 dark:bg-gray-900/98 backdrop-blur-xl border-b border-[var(--hairline-soft)] lg:hidden transition-all duration-300 overflow-hidden ${
            menuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block py-3.5 px-3 font-medium text-[15px] font-ui rounded-lg transition-colors ${
                    isActive
                      ? "text-[var(--ink)] dark:text-white bg-[var(--soft-cloud)] dark:bg-white/5"
                      : "text-[var(--mute)] dark:text-gray-300 hover:text-[var(--ink)] dark:hover:text-white hover:bg-[var(--soft-cloud)] dark:hover:bg-white/5"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-[var(--ink)] dark:bg-white align-middle" />
                  )}
                </Link>
              );
            })}

            {/* Auth section */}
            <div className="mt-3 pt-3 border-t border-[var(--hairline)] flex flex-col gap-2">
              {!loading && (
                sessionUser ? (
                  <div className="flex items-center justify-between py-2 px-3">
                    <span className="text-[var(--mute)] dark:text-gray-300 text-sm font-ui">Akun Anda</span>
                    <UserDropdown />
                  </div>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="block text-center py-3 font-medium text-[15px] font-ui text-[var(--ink)] dark:text-white border border-[var(--hairline)] dark:border-white/20 rounded-full transition hover:bg-[var(--soft-cloud)] dark:hover:bg-white/5"
                    >
                      Masuk
                    </Link>
                    <Link
                      href="/auth/register"
                      className="btn-primary text-center"
                    >
                      Daftar Sekarang
                    </Link>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
