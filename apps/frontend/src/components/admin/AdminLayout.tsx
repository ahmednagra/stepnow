// apps/frontend/src/components/admin/AdminLayout.tsx
// Admin shell. Sidebar counts stream in via Suspense so shell renders instantly.

import { Suspense, type ReactNode } from "react";
import type { CurrentAdmin } from "@/types";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { ToastHost } from "./ToastHost";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { serverApiClient } from "@/lib/server-api";
import { ENDPOINTS } from "@/services/api/endpoints";

interface AdminLayoutProps {
  admin: CurrentAdmin;
  children: ReactNode;
}

async function SidebarWithCounts() {
  const token = await getAccessTokenFromCookies();
  if (!token) return <AdminSidebar counts={{ bookings: 0, messages: 0 }} />;
  try {
    const [bk, mg] = await Promise.all([
      serverApiClient.get<{ pagination: { total: number } }>(
        ENDPOINTS.ADMIN.BOOKINGS, { params: { status: "new", size: 1 } }, token,
      ),
      serverApiClient.get<{ pagination: { total: number } }>(
        ENDPOINTS.ADMIN.CONTACT_MESSAGES, { params: { is_handled: false, size: 1 } }, token,
      ),
    ]);
    return (
      <AdminSidebar
        counts={{
          bookings: bk.data?.pagination?.total ?? 0,
          messages: mg.data?.pagination?.total ?? 0,
        }}
      />
    );
  } catch {
    return <AdminSidebar counts={{ bookings: 0, messages: 0 }} />;
  }
}

export function AdminLayout({ admin, children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-[#FAFAF7] font-sans text-slate-900">
      <Suspense fallback={<AdminSidebar counts={{ bookings: 0, messages: 0 }} />}>
        <SidebarWithCounts />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar admin={admin} />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
      <ToastHost />
    </div>
  );
}
