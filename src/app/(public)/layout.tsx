import PublicNavbar from "@/components/users/PublicNavbar";
import PublicFooter from "@/components/users/PublicFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-white dark:bg-gray-900 transition-colors duration-300">
      <PublicNavbar />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
