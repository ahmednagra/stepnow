// apps/frontend/src/app/admin/(authed)/notifications/page.tsx
// Notification inbox — full history of admin notifications. Mirrors the contact-messages /
// audit-log list pattern (AdminPageHeader + AdminCard + AdminTable + Pagination), driven by the
// React Query hooks (useNotifications + the notification mutation hooks). An "Unread only" chip
// filters server-side; per-row actions mark read / archive; the header marks all read.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Archive, CheckCheck, ArrowRight, Circle } from "lucide-react";
import {
  AdminPageHeader,
  AdminCard,
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  AdminTableEmpty,
  Pagination,
} from "@/components/admin";
import { useNotifications } from "@/hooks/queries";
import {
  useMarkNotificationsRead,
  useMarkAllNotificationsRead,
  useArchiveNotification,
} from "@/hooks/mutations";
import { useAdminToast } from "@/hooks/useAdminToast";
import { ApiError } from "@/lib/api-errors";
import { cn } from "@/utils/cn";

const PAGE_SIZE = 20;

const deDateTime = (iso: string) =>
  new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const chipCls = (active: boolean) =>
  cn(
    "h-8 px-3 text-[11.5px] font-semibold border transition-colors inline-flex items-center gap-1.5",
    active
      ? "bg-slate-900 text-white border-slate-900"
      : "bg-white text-slate-600 border-slate-300 hover:border-slate-400",
  );

export default function NotificationsPage() {
  const pushToast = useAdminToast((s) => s.push);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, isLoading: loading, error } = useNotifications({
    page,
    size: PAGE_SIZE,
    unreadOnly,
  });
  const items = data?.items ?? null;
  const pagination = data?.pagination;

  const markRead = useMarkNotificationsRead();
  const markAll = useMarkAllNotificationsRead();
  const archive = useArchiveNotification();

  const errorMessage = useMemo(
    () => (error ? (error instanceof ApiError ? error.message : "Network error") : null),
    [error],
  );

  const onMarkRead = (id: string) =>
    markRead.mutate([id], {
      onError: (e) => pushToast("error", "Could not mark read", e instanceof ApiError ? e.message : "Network error"),
    });

  const onArchive = (id: string) =>
    archive.mutate(id, {
      onSuccess: () => pushToast("success", "Archived"),
      onError: (e) => pushToast("error", "Could not archive", e instanceof ApiError ? e.message : "Network error"),
    });

  const onMarkAll = () =>
    markAll.mutate(undefined, {
      onSuccess: () => pushToast("success", "All notifications marked read"),
      onError: (e) => pushToast("error", "Could not mark all read", e instanceof ApiError ? e.message : "Network error"),
    });

  return (
    <>
      <AdminPageHeader
        eyebrow="System"
        title="Notifications"
        description="Operational alerts — new orders, status changes, invoices and payments."
        actions={
          <button
            type="button"
            onClick={onMarkAll}
            disabled={markAll.isPending}
            className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3.5 text-[12.5px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
          >
            <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            Mark all read
          </button>
        }
      />

      <div className="p-6">
        <div className="mb-4 flex items-center gap-1.5">
          <button type="button" className={chipCls(!unreadOnly)} onClick={() => { setPage(1); setUnreadOnly(false); }}>
            All
          </button>
          <button type="button" className={chipCls(unreadOnly)} onClick={() => { setPage(1); setUnreadOnly(true); }}>
            Unread only
          </button>
        </div>

        {errorMessage && (
          <p className="mb-4 border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
            {errorMessage}
          </p>
        )}

        <AdminCard flush title={`${pagination?.total ?? 0} ${pagination?.total === 1 ? "notification" : "notifications"}`}>
          <AdminTable columns={["", "Notification", "Category", "When", ""]} stickyHeader>
            {loading ? (
              <AdminTableEmpty loading />
            ) : !items || items.length === 0 ? (
              <AdminTableEmpty message="No notifications." />
            ) : (
              items.map((n) => (
                <AdminTableRow key={n.id} className={cn(!n.is_read && "bg-slate-50/60")}>
                  <AdminTableCell className="w-8 align-top">
                    {n.is_read ? (
                      <Circle className="h-2.5 w-2.5 text-slate-300" aria-label="Read" />
                    ) : (
                      <Circle className="h-2.5 w-2.5 fill-[#A8865A] text-[#A8865A]" aria-label="Unread" />
                    )}
                  </AdminTableCell>
                  <AdminTableCell className="align-top">
                    {n.link ? (
                      <Link href={n.link} className="font-medium text-slate-900 hover:underline">
                        {n.title}
                      </Link>
                    ) : (
                      <span className="font-medium text-slate-900">{n.title}</span>
                    )}
                    {n.body && <p className="mt-0.5 line-clamp-2 max-w-lg text-[12px] text-slate-500">{n.body}</p>}
                  </AdminTableCell>
                  <AdminTableCell className="align-top">
                    <span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-700">
                      {n.category}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell className="align-top">
                    <time dateTime={n.created_at} className="text-[11.5px] tabular-nums text-slate-500" title={n.created_at}>
                      {deDateTime(n.created_at)}
                    </time>
                  </AdminTableCell>
                  <AdminTableCell className="align-top text-right">
                    <div className="inline-flex items-center gap-1">
                      {!n.is_read && (
                        <button
                          type="button"
                          onClick={() => onMarkRead(n.id)}
                          disabled={markRead.isPending}
                          aria-label="Mark read"
                          className="inline-grid h-7 w-7 place-items-center border border-transparent text-slate-400 hover:border-slate-200 hover:bg-white hover:text-emerald-700 disabled:opacity-40"
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onArchive(n.id)}
                        disabled={archive.isPending}
                        aria-label="Archive"
                        className="inline-grid h-7 w-7 place-items-center border border-transparent text-slate-400 hover:border-slate-200 hover:bg-white hover:text-rose-700 disabled:opacity-40"
                      >
                        <Archive className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                      </button>
                      {n.link && (
                        <Link
                          href={n.link}
                          className="inline-flex items-center gap-1 px-1.5 text-[12px] font-medium text-slate-700 hover:text-slate-900"
                        >
                          Open <ArrowRight className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))
            )}
          </AdminTable>
        </AdminCard>

        {pagination && pagination.pages > 1 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.pages}
            totalItems={pagination.total}
            onPageChange={setPage}
          />
        )}
      </div>
    </>
  );
}
