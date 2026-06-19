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
  { label: "Players", href: "/players" },
  { label: "Turnamen", href: "/tournaments" },
  { label: "Kalender", href: "/calendar" },
  { label: "Galeri", href: "/gallery" },
  { label: "Tentang", href: "/about" },
  { label: "Nonton spin", href: "/spin-wheel" },
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
    
    // Auth Check
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

  // Close mobile menu when pathname changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[999] h-20 flex items-center transition-all duration-300 ${
        scrolled || menuOpen || pathname !== "/"
          ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-[15px] border-b border-gray-100 dark:border-gray-800"
          : "bg-transparent"
      }`}
      aria-label="Main navigation"
    >
      <div className="w-full px-4 md:px-8 xl:px-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0" aria-label="PB Prabu Bandung">
          <Image src="/1.png" alt="PB Prabu Logo" width={44} height={44} priority style={{ width: "auto", height: "44px" }} />
          <span className="text-gray-900 dark:text-white font-bold text-lg hidden sm:block">PB Prabu Bandung</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative px-4 py-2 text-sm transition-colors duration-200 ${
                  isActive ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-gray-700 dark:text-gray-300 font-medium hover:text-indigo-600 dark:hover:text-indigo-400"
                }`}
              >
                {link.label}
                <span 
                  className={`absolute bottom-0 left-4 right-4 h-[2.5px] bg-indigo-600 dark:bg-indigo-400 rounded-t-full transition-transform duration-300 origin-left ${
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`} 
                />
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="border-r border-gray-200 dark:border-white/10 pr-4">
            <ThemeToggleButton />
          </div>

          {!loading && (
            sessionUser ? (
              <div className="scale-90 origin-right">
                {/* Wrap in light theme by default if parent has dark theme applied, but UserDropdown has its own theme handling */}
                <UserDropdown />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="px-5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-white/10"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  className="px-5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-white/10px-5 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-gray-900 rounded-xl transition-colors shadow-lg"
                >
                  Daftar
                </Link>
              </div>
            )
          )}
        </div>

        {/* Mobile hamburger & Theme */}
        <div className="lg:hidden flex items-center gap-3">
          <ThemeToggleButton />
          <button
            className="flex flex-col gap-1.5 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className={`block h-0.5 w-5 bg-gray-600 dark:bg-gray-300 transition-transform duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 w-5 bg-gray-600 dark:bg-gray-300 transition-opacity duration-300 ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-gray-600 dark:bg-gray-300 transition-transform duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`absolute top-20 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 flex flex-col gap-1 px-4 pb-6 transition-all duration-300 lg:hidden ${
          menuOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
        id="mobile-menu"
      >
        {navLinks.map((link) => {
          const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group font-medium py-3 px-3 transition-colors text-base block ${
                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              }`}
            >
              <span className="relative inline-block">
                {link.label}
                <span 
                  className={`absolute -bottom-1 left-0 right-0 h-[2px] bg-indigo-600 dark:bg-indigo-400 transition-transform duration-300 origin-left ${
                    isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`} 
                />
              </span>
            </Link>
          );
        })}
        
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
          {!loading && (
            sessionUser ? (
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-700 dark:text-gray-300">Akun Anda</span>
                <UserDropdown />
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-center px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  className="text-center px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white border border-gray-300 dark:border-white/20 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition"
                >
                  Daftar
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
