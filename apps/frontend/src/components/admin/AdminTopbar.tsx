// apps/frontend/src/components/admin/AdminTopbar.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, LogOut, ShieldCheck } from "lucide-react";
import type { CurrentAdmin } from "@/types";
import { logout as logoutAdmin } from "@/services/auth";
import { cn } from "@/utils/cn";

interface AdminTopbarProps {
  admin: CurrentAdmin;
}

/** Build initials from a full name, falling back to the email local-part. */
function getInitials(admin: CurrentAdmin): string {
  const source = (admin.full_name || admin.email.split("@")[0] || "").trim();
  if (!source) return "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return source.slice(0, 2).toUpperCase();
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

export function AdminTopbar({ admin }: AdminTopbarProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = getInitials(admin);
  const displayName = admin.full_name?.trim() || admin.email.split("@")[0];
  const lastLogin = formatLastLogin(admin.last_login_at);

  // Close on outside click + Esc.
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleLogout() {
    await logoutAdmin();
    window.location.href = "/admin/login";
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-6">
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

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={open}
          className={cn(
            "flex items-center gap-2.5 border border-transparent px-2 py-1.5 transition-colors",
            "hover:border-slate-200 hover:bg-slate-50",
            open && "border-slate-200 bg-slate-50",
          )}
        >
          <span
            aria-hidden="true"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center bg-slate-900 text-[10.5px] font-semibold tracking-wide text-amber-300"
          >
            {initials}
          </span>
          <span className="hidden min-w-0 flex-col items-start leading-tight sm:flex">
            <span className="max-w-[160px] truncate text-[12.5px] font-medium text-slate-900">
              {displayName}
            </span>
            <span className="max-w-[160px] truncate text-[11px] text-slate-500">
              {admin.email}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform",
              open && "rotate-180",
            )}
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 top-[calc(100%+4px)] z-30 w-72 border border-slate-200 bg-white shadow-[0_8px_24px_-4px_rgba(15,23,42,0.12)]"
          >
            {/* Identity block */}
            <div className="flex items-start gap-3 border-b border-slate-200 px-4 py-3.5">
              <span
                aria-hidden="true"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center bg-slate-900 text-[11.5px] font-semibold tracking-wide text-amber-300"
              >
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-slate-900">
                  {displayName}
                </p>
                <p className="mt-0.5 truncate text-[11.5px] text-slate-500">
                  {admin.email}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                  <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2} aria-hidden="true" />
                  Administrator
                </p>
              </div>
            </div>

            {/* Meta */}
            <dl className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Last sign-in
                </dt>
                <dd className="text-[11.5px] tabular-nums text-slate-700">
                  {lastLogin ?? "—"}
                </dd>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Status
                </dt>
                <dd className="inline-flex items-center gap-1 text-[11.5px] text-slate-700">
                  <span
                    aria-hidden="true"
                    className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"
                  />
                  Active
                </dd>
              </div>
            </dl>

            {/* Actions */}
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
    </header>
  );
}