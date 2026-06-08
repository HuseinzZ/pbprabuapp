import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spin Wheel Live | PB Prabu Bandung",
  description: "Spin wheel undian turnamen PB Prabu Bandung.",
};

export default function SpinWheelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}