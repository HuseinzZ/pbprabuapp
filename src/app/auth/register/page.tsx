import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | PB Prabu Bandung",
  description: "Daftar akun PB Prabu Bandung baru.",
};

export default function RegisterPage() {
  return <SignUpForm />;
}
