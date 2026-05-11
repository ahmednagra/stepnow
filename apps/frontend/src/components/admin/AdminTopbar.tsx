// apps/frontend/src/components/admin/AdminTopbar.tsx

"use client";

import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import type { CurrentAdmin } from "@/types";
import { logout as logoutAdmin } from "@/services/auth";

interface AdminTopbarProps {
  admin: CurrentAdmin;
}

export function AdminTopbar({ admin }: AdminTopbarProps) {
  async function handleLogout() {
    await logoutAdmin();
    window.location.href = "/admin/login";
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="flex items-center gap-6">
        <Link
          href="/"
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1.5 text-[12px] text-slate-600 transition-colors hover:text-slate-900"
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          View site
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[12px] text-slate-600">{admin.email}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-slate-700 transition-colors hover:text-slate-900"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          Logout
        </button>
      </div>
    </header>
  );
}
