import { Metadata } from "next";
import AboutSection from "@/components/users/AboutSection";
import FAQSection from "@/components/users/FAQSection";

export const metadata: Metadata = {
  title: "Tentang Kami - PB Prabu Bandung",
  description: "Pelajari lebih lanjut tentang komunitas badminton PB Prabu Bandung.",
};

export default function AboutPage() {
  return (
    <div className="pt-20">
      <AboutSection />
      <FAQSection />
    </div>
  );
}
