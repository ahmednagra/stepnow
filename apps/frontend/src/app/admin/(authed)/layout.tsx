// apps/frontend/src/app/admin/(authed)/layout.tsx
// Gated route-group layout. Adds the global CommandPalette mounted once.

import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentAdmin } from "@/lib/admin-session";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CommandPalette } from "@/components/admin";

export default async function AdminAuthedLayout({ children }: { children: ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return (
    <AdminLayout admin={admin}>
      {children}
      <CommandPalette />
    </AdminLayout>
  );
}
