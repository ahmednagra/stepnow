// apps/frontend/src/components/admin/AdminTopbar.tsx
// Modern topbar: mobile menu toggle, cmd-k search trigger, View site, notifications, profile menu.

"use client";

import { useEffect, useRef, useState, memo } from "react";
import Link from "next/link";
import { Bell, ChevronDown, ExternalLink, LogOut, Menu, Search, ShieldCheck } from "lucide-react";
import type { CurrentAdmin } from "@/types";
import { logout as logoutAdmin } from "@/services/auth";
import { cn } from "@/utils/cn";
import { openCommandPalette } from "@/hooks/useCommandPalette";
import { useMobileNav } from "@/hooks/useMobileNav";

interface AdminTopbarProps {
  admin: CurrentAdmin;
}

function getInitials(admin: CurrentAdmin): string {
  const src = (admin.full_name || admin.email.split("@")[0] || "").trim();
  if (!src) return "?";
  const parts = src.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return src.slice(0, 2).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatLastLogin(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

function AdminTopbarBase({ admin }: AdminTopbarProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleMobileNav = useMobileNav((s) => s.toggle);

  const initials = getInitials(admin);
  const displayName = admin.full_name?.trim() || admin.email.split("@")[0];
  const lastLogin = formatLastLogin(admin.last_login_at);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function handleLogout() {
    try {
      await logoutAdmin();
    } finally {
      window.location.href = "/admin/login";
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5">
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile menu toggle — opens the sidebar drawer (hidden from lg up) */}
        <button
          type="button"
          onClick={toggleMobileNav}
          aria-label="Open menu"
          className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
        </button>

        <Link
          href="/"
          target="_blank"
          rel="noopener"
          className="hidden items-center gap-1.5 text-[12px] text-slate-600 transition-colors hover:text-slate-900 sm:flex"
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
          View site
        </Link>
        <span aria-hidden="true" className="hidden h-4 w-px bg-slate-200 sm:block" />
        <button
          type="button"
          onClick={openCommandPalette}
          className="flex h-8 w-44 items-center gap-2 rounded-sm bg-[#F5F2EC] px-2.5 text-[12px] text-slate-500 transition-colors hover:bg-[#EDE7DC] sm:w-56 md:w-72"
        >
          <Search className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span className="flex-1 truncate text-left">Search bookings, customers, services…</span>
          <kbd className="hidden rounded-sm border border-slate-300 bg-white px-1 py-px font-mono text-[10px] tracking-tight text-slate-500 sm:inline">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="relative grid h-8 w-8 place-items-center text-slate-500 transition-colors hover:text-slate-900"
        >
          <Bell className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#A8865A] ring-2 ring-white"
          />
        </button>

        <div ref={menuRef} className="relative border-l border-slate-200 pl-3">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2.5"
          >
            <span
              aria-hidden="true"
              className="inline-flex h-8 w-8 items-center justify-center bg-slate-900 text-[11px] font-semibold tracking-wide text-amber-300"
            >
              {initials}
            </span>
            <span className="hidden text-left md:block">
              <span className="block text-[12.5px] font-semibold text-slate-900">
                {displayName}
              </span>
              <span className="block text-[10.5px] text-slate-500">{admin.email}</span>
            </span>
            <ChevronDown
              className={cn("h-3 w-3 text-slate-400 transition-transform", open && "rotate-180")}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 top-full z-40 mt-1 w-72 border border-slate-200 bg-white shadow-[0_8px_24px_-4px_rgba(15,23,42,0.10)]"
            >
              <div className="flex items-start gap-3 border-b border-slate-200 px-4 py-3.5">
                <span
                  aria-hidden="true"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-slate-900 text-[11.5px] font-semibold tracking-wide text-amber-300"
                >
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-slate-900">{displayName}</p>
                  <p className="mt-0.5 truncate text-[11.5px] text-slate-500">{admin.email}</p>
                  <p className="mt-2 inline-flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                    <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2} aria-hidden="true" />
                    Administrator
                  </p>
                </div>
              </div>
              <dl className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Last sign-in
                  </dt>
                  <dd className="text-[11.5px] tabular-nums text-slate-700">{lastLogin ?? "—"}</dd>
                </div>
              </dl>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[12.5px] font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export const AdminTopbar = memo(AdminTopbarBase);
