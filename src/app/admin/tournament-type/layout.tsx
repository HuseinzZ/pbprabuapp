import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tipe Turnamen | PB Prabu Bandung",
  description: "Manajemen tipe turnamen dan distribusi poin ranking.",
};

export default function TournamentTypeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}