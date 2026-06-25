import { Metadata } from "next";
import GalleryClient from "./GalleryClient";

export const metadata: Metadata = {
  title: "Galeri - PB Prabu Bandung",
  description: "Kumpulan foto dan dokumentasi kegiatan turnamen, latihan, dan momen spesial komunitas badminton PB Prabu Bandung.",
};

export default function GalleryPage() {
  return <GalleryClient />;
}
