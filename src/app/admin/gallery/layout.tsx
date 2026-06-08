import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galeri Foto | PB Prabu Bandung",
  description: "Galeri foto kegiatan PB Prabu Bandung.",
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}