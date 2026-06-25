import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manajemen User | PB Prabu Bandung",
  description: "Halaman manajemen user PB Prabu Bandung.",
};

export default function PlayersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
