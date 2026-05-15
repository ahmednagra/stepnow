// apps/frontend/src/components/admin/AdminLayout.tsx
// Shell layout. Sidebar counts come from a tiny dedicated endpoint so unrelated pages don't refetch.
// Server-component only — never import from a "use client" file. The barrel
// `components/admin/index.ts` intentionally does NOT re-export this.

import type { ReactNode } from "react";
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

async function loadCounts(): Promise<{ bookings: number; messages: number }> {
  const token = await getAccessTokenFromCookies();
  if (!token) return { bookings: 0, messages: 0 };
  try {
    const [bk, mg] = await Promise.all([
      serverApiClient.get<{ pagination: { total: number } }>(
        ENDPOINTS.ADMIN.BOOKINGS, { params: { status: "new", size: 1 } }, token,
      ),
      serverApiClient.get<{ pagination: { total: number } }>(
        ENDPOINTS.ADMIN.CONTACT_MESSAGES, { params: { is_handled: false, size: 1 } }, token,
      ),
    ]);
    return {
      bookings: bk.data?.pagination?.total ?? 0,
      messages: mg.data?.pagination?.total ?? 0,
    };
  } catch {
    return { bookings: 0, messages: 0 };
  }
}

export async function AdminLayout({ admin, children }: AdminLayoutProps) {
  const counts = await loadCounts();
  return (
    <div className="flex h-screen bg-[#FAFAF7] font-sans text-slate-900">
      <AdminSidebar counts={counts} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar admin={admin} />
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
      <ToastHost />
    </div>
  );
}
