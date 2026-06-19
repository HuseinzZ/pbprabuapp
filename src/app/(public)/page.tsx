import { Metadata } from "next";
import HeroSection from "@/components/users/HeroSection";
import SponsorSection from "@/components/users/SponsorSection";
// import FeaturesSection from "@/components/users/FeaturesSection";
// import HowItWorksSection from "@/components/users/HowItWorksSection";
// import CTASection from "@/components/users/CTASection";

export const metadata: Metadata = {
  title: "PB Prabu Bandung – Portal Komunitas Badminton",
  description:
    "Portal resmi komunitas badminton PB Prabu Bandung. Daftar, ikuti turnamen, pantau ranking, dan nikmati galeri kegiatan komunitas.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      {/* <FeaturesSection />
      <HowItWorksSection />
      <CTASection /> */}
      <SponsorSection />
    </>
  );
}
