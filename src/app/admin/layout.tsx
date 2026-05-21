"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import Footer from "@/components/footer/Footer";
import { SidebarProvider } from "@/context/SidebarContext";

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const { isExpanded, isHovered, isMobileOpen } = useSidebar();

    const mainContentMargin = isMobileOpen
        ? "ml-0"
        : isExpanded || isHovered
            ? "lg:ml-[290px]"
            : "lg:ml-[90px]";

    return (
        <div className="min-h-screen xl:flex bg-white dark:bg-gray-900">
            <AppSidebar />
            <Backdrop />
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${mainContentMargin}`}>
                <AppHeader />
                <main className="flex-1 p-4 mx-auto max-w-screen-2xl md:p-6 w-full">
                    {children}
                </main>
                <Footer />
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AdminLayoutContent>
                {children}
            </AdminLayoutContent>
        </SidebarProvider>
    );
}