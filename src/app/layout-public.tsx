import React from "react";
import PublicNavbar from "@/components/users/PublicNavbar";
import PublicFooter from "@/components/users/PublicFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[rgb(23,24,27)] text-white overflow-x-hidden">
      <PublicNavbar />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
