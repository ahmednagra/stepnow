// apps/frontend/src/app/admin/(authed)/layout.tsx
// Gated route-group layout. Adds the global CommandPalette mounted once.

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { getCurrentAdmin } from "@/lib/admin-session";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CommandPalette } from "@/components/admin";

export default async function AdminAuthedLayout({ children }: { children: ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    // Preserve the intended deep link so the login form (which already reads
    // `?next=`) returns the user exactly where they were headed.
    const headersList = await headers();
    const intended = headersList.get("x-pathname") ?? "/admin";
    redirect(`/admin/login?next=${encodeURIComponent(intended)}`);
  }
  return (
    <AdminLayout admin={admin}>
      {children}
      <CommandPalette />
    </AdminLayout>
  );
}
