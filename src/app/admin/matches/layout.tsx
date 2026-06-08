import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jadwal Pertandingan | PB Prabu Bandung",
  description: "Jadwal pertandingan turnamen badminton PB Prabu Bandung.",
};

export default function MatchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}