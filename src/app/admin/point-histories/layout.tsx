import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Riwayat Poin | PB Prabu Bandung",
  description: "Riwayat poin pemain badminton PB Prabu Bandung.",
};

export default function PointHistoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}