import { ThemeToggleButton as ThemeToggle } from "@/components/common/ThemeToggleButton";
import React, { Suspense } from "react";
import Loader from "@/components/shared/Loader";
import Footer from "@/components/footer/Footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Top bar */}
      <header className="flex items-center justify-end px-6 py-4 relative z-10">
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-2">
        <Suspense fallback={<Loader />}>
          {children}
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
