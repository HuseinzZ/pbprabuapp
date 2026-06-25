import { Metadata } from "next";
import AboutSection from "@/components/users/AboutSection";
import FAQSection from "@/components/users/FAQSection";
import SponsorSection from "@/components/users/SponsorSection";

export const metadata: Metadata = {
  title: "Tentang Kami - PB Prabu Bandung",
  description: "Pelajari lebih lanjut tentang komunitas badminton PB Prabu Bandung.",
};

export default function AboutPage() {
  return (
    <div className="page-fade-in">
      <AboutSection />
      <FAQSection />
      <SponsorSection />
    </div>
  );
}
