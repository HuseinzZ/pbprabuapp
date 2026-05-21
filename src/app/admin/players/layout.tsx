import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manajemen Pemain | PB Prabu Bandung",
  description: "Halaman manajemen pemain PB Prabu Bandung.",
};

export default function PlayersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
