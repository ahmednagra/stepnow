// src/components/admin/NotificationBell.tsx
// Admin header bell: shows the unread count badge and a dropdown of recent notifications.
// Reads via React Query (useNotifications / useUnreadNotificationCount); marking read/all and
// archiving go through the mutation hooks, which invalidate the list + count. No WebSocket —
// the count polls on a 60s interval (see useUnreadNotificationCount).

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import {
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/queries";
import {
  useMarkNotificationsRead,
  useMarkAllNotificationsRead,
  useArchiveNotification,
} from "@/hooks/mutations";
import { cn } from "@/utils/cn";

const deDateTime = (iso: string) =>
  new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: countData } = useUnreadNotificationCount();
  const unread = countData?.unread ?? 0;

  // Only fetch the list while the dropdown is open.
  const { data, isLoading } = useNotifications({ size: 10 }, { enabled: open });
  const items = data?.items ?? [];

  const markRead = useMarkNotificationsRead();
  const markAll = useMarkAllNotificationsRead();
  const archive = useArchiveNotification();

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-8 w-8 place-items-center text-slate-500 transition-colors hover:text-slate-900"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[360px] border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
            <p className="text-[12px] font-semibold text-slate-700">Notifications</p>
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending || unread === 0}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 disabled:opacity-40"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" /> Mark all read
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {isLoading && <p className="px-3 py-6 text-center text-[12px] text-slate-400">Loading…</p>}
            {!isLoading && items.length === 0 && (
              <p className="px-3 py-6 text-center text-[12px] text-slate-400">No notifications</p>
            )}
            {items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "group flex items-start gap-2 border-b border-slate-100 px-3 py-2.5 last:border-b-0",
                  !n.is_read && "bg-slate-50",
                )}
              >
                <div className="min-w-0 flex-1">
                  {n.link ? (
                    <Link href={n.link} onClick={() => setOpen(false)} className="block">
                      <p className="truncate text-[12.5px] font-medium text-slate-800">{n.title}</p>
                    </Link>
                  ) : (
                    <p className="truncate text-[12.5px] font-medium text-slate-800">{n.title}</p>
                  )}
                  {n.body && <p className="mt-0.5 truncate text-[11.5px] text-slate-500">{n.body}</p>}
                  <p className="mt-0.5 text-[10.5px] text-slate-400">{deDateTime(n.created_at)}</p>
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100">
                  {!n.is_read && (
                    <button
                      type="button"
                      onClick={() => markRead.mutate([n.id])}
                      className="text-slate-400 hover:text-emerald-700"
                      aria-label="Mark read"
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => archive.mutate(n.id)}
                    className="text-slate-400 hover:text-rose-700"
                    aria-label="Archive"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 px-3 py-2 text-center">
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="text-[11.5px] text-slate-500 hover:text-slate-800"
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
