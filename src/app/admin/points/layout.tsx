import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manajemen Poin | PB Prabu Bandung",
  description: "Manajemen poin dan distribusi poin ranking.",
};

export default function PointLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}