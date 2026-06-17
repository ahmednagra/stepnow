// apps/frontend/src/components/admin/AdminLayout.tsx
// Admin shell. Client component — sidebar counts load via React Query (browser bearer auth).

"use client";

import type { ReactNode } from "react";
import type { CurrentAdmin } from "@/types";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { ToastHost } from "./ToastHost";
import { useSidebarCounts } from "@/hooks/queries/useSidebarCounts";

interface AdminLayoutProps {
  admin: CurrentAdmin;
  children: ReactNode;
}

export function AdminLayout({ admin, children }: AdminLayoutProps) {
  const { data: counts } = useSidebarCounts();
  return (
    <div className="flex h-screen bg-[#FAFAF7] font-sans text-slate-900">
      <AdminSidebar counts={counts ?? { bookings: 0, messages: 0 }} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar admin={admin} />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
      <ToastHost />
    </div>
  );
}
