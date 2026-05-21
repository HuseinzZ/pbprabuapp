import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hapus Pemain | PB Prabu Bandung",
  description: "Konfirmasi penghapusan data pemain.",
};

export default function DeletePlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
