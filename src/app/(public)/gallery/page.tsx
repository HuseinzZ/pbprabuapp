import { Metadata } from "next";
import GallerySection from "@/components/users/GallerySection";

export const metadata: Metadata = {
  title: "Galeri - PB Prabu Bandung",
  description: "Kumpulan foto kegiatan dan turnamen komunitas badminton PB Prabu Bandung.",
};

export default function GalleryPage() {
  return (
    <div className="pt-20">
      <GallerySection />
    </div>
  );
}
