import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Manajemen Turnamen | PB Prabu Bandung",
  description: "Kelola data turnamen badminton PB Prabu Bandung.",
};

export default function TournamentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}