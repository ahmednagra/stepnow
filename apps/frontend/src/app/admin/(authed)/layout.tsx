// src/app/admin/(authed)/layout.tsx
// Route-group layout that gates everything under /admin/* (except /admin/login).
// Server component — calls getCurrentAdmin() and redirects on null.

import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentAdmin } from "@/lib/admin-session";
import { AdminLayout } from "@/components/admin";

export default async function AdminAuthedLayout({ children }: { children: ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }
  return <AdminLayout admin={admin}>{children}</AdminLayout>;
}
