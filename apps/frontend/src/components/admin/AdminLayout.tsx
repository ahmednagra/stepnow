// src/components/admin/AdminLayout.tsx
import type { ReactNode } from "react";
import type { CurrentAdmin } from "@/types";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { ToastHost } from "./ToastHost";

interface AdminLayoutProps {
  admin: CurrentAdmin;
  children: ReactNode;
}

export function AdminLayout({ admin, children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar admin={admin} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <ToastHost />
    </div>
  );
}
