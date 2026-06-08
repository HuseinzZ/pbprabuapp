import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Klasemen Grup | PB Prabu Bandung",
  description: "Klasemen grup turnamen badminton PB Prabu Bandung.",
};

export default function StandingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}