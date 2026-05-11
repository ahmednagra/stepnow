// src/components/admin/AdminTopbar.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { logout } from "@/services/auth";
import { useAdminToast } from "@/hooks/useAdminToast";
import type { CurrentAdmin } from "@/types";

interface AdminTopbarProps {
  admin: CurrentAdmin;
}

export function AdminTopbar({ admin }: AdminTopbarProps) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      router.push("/admin/login");
      router.refresh();
    } catch {
      pushToast("error", "Logout failed", "Try again, or close the browser to clear the session.");
      setLoggingOut(false);
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-end gap-4 border-b border-slate-200 bg-white px-6">
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex items-center gap-2 rounded px-2 py-1 text-sm text-slate-700 transition-colors hover:bg-slate-100"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
            {initials(admin.full_name || admin.email)}
          </span>
          <span className="hidden flex-col items-start leading-tight md:flex">
            <span className="text-[12px] font-medium text-slate-900">
              {admin.full_name || admin.email}
            </span>
            <span className="text-[10px] text-slate-500">{admin.email}</span>
          </span>
          <ChevronDown className="h-3 w-3 text-slate-400" aria-hidden="true" />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              aria-hidden="true"
              onClick={() => setMenuOpen(false)}
            />
            <div
              role="menu"
              className="absolute right-0 z-40 mt-2 w-56 border border-slate-200 bg-white py-1 shadow-md"
            >
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="flex items-center gap-2 text-xs font-medium text-slate-900">
                  <UserIcon className="h-3 w-3 text-slate-400" aria-hidden="true" />
                  Signed in as
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">{admin.email}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                disabled={loggingOut}
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut className="h-3 w-3" aria-hidden="true" />
                {loggingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}
