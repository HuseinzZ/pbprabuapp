import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Peserta Turnamen | PB Prabu Bandung",
  description: "Kelola data peserta turnamen badminton PB Prabu Bandung.",
};

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}