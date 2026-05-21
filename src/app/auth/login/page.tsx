import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | PB Prabu Bandung",
  description: "Masuk ke akun PB Prabu Bandung Anda.",
};

export default function LoginPage() {
  return <SignInForm />;
}
