import UserLayoutContent from "@/components/users/UserLayoutContent";
import React from "react";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <UserLayoutContent>{children}</UserLayoutContent>;
}
