// src/app/admin/(authed)/contact-messages/page.tsx
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Search, CheckCircle2, Circle, Mail } from "lucide-react";
import {
  AdminPageHeader,
  AdminCard,
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  AdminTableEmpty,
  Pagination,
} from "@/components/admin";
import { listAdminContactMessages } from "@/services/contact";
import type { ContactMessageAdmin, Pagination as PaginationInfo } from "@/types";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";

type HandledFilter = "all" | "unhandled" | "handled";
const PAGE_SIZE = 25;

export default function ContactMessagesPage() {
  const pushToast = useAdminToast((s) => s.push);
  const [items, setItems] = useState<ContactMessageAdmin[] | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [handled, setHandled] = useState<HandledFilter>("unhandled");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(
    async function reload() {
      setLoading(true);
      try {
        const params: Parameters<typeof listAdminContactMessages>[0] = {
          page,
          size: PAGE_SIZE,
          q: q || undefined,
        };
        if (handled === "unhandled") params.is_handled = false;
        else if (handled === "handled") params.is_handled = true;
        const res = await listAdminContactMessages(params);
        setItems(res.items);
        setPagination(res.pagination);
      } catch (err) {
        pushToast(
          "error",
          "Could not load messages",
          err instanceof ApiError ? err.message : "Network error",
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [page, handled, q, pushToast],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [handled, q]);

  return (
    <>
      <AdminPageHeader
        title="Contact messages"
        description="Messages submitted via the public contact form."
      />
      <div className="p-6">
        <AdminCard
          flush
          title={`${pagination?.total ?? 0} message${pagination?.total === 1 ? "" : "s"}`}
          headerActions={
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  placeholder="Search name, email, message…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="h-8 w-64 border border-slate-300 bg-white pl-7 pr-2 text-[12px] text-slate-700 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
              <select
                value={handled}
                onChange={(e) => setHandled(e.target.value as HandledFilter)}
                className="h-8 border border-slate-300 bg-white px-2 text-[12px] text-slate-700"
                aria-label="Filter by status"
              >
                <option value="unhandled">Unhandled</option>
                <option value="handled">Handled</option>
                <option value="all">All</option>
              </select>
            </div>
          }
        >
          <AdminTable columns={["", "From", "Category", "Message", "Received", ""]}>
            {loading ? (
              <AdminTableEmpty message="Loading…" />
            ) : !items || items.length === 0 ? (
              <AdminTableEmpty message="No messages found." />
            ) : (
              items.map((m) => (
                <AdminTableRow key={m.id}>
                  <AdminTableCell className="w-8 align-top">
                    {m.is_handled ? (
                      <CheckCircle2
                        className="h-3.5 w-3.5 text-emerald-500"
                        aria-label="Handled"
                      />
                    ) : (
                      <Circle
                        className="h-3.5 w-3.5 text-amber-500"
                        aria-label="Unhandled"
                      />
                    )}
                  </AdminTableCell>
                  <AdminTableCell className="align-top">
                    <Link
                      href={`/admin/contact-messages/${m.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {m.name}
                    </Link>
                    <p className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Mail className="h-2.5 w-2.5" />
                      {m.email}
                    </p>
                  </AdminTableCell>
                  <AdminTableCell className="align-top">
                    <span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-700">
                      {m.subject_category}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell className="align-top">
                    <p className="line-clamp-2 max-w-md text-[12px] text-slate-600">
                      {m.message}
                    </p>
                  </AdminTableCell>
                  <AdminTableCell className="align-top">
                    <time
                      dateTime={m.created_at}
                      className="text-[11px] tabular-nums text-slate-500"
                      title={m.created_at}
                    >
                      {new Date(m.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </AdminTableCell>
                  <AdminTableCell className="align-top text-right">
                    <Link
                      href={`/admin/contact-messages/${m.id}`}
                      className="text-[12px] font-medium text-slate-700 hover:text-slate-900"
                    >
                      Open →
                    </Link>
                  </AdminTableCell>
                </AdminTableRow>
              ))
            )}
          </AdminTable>
        </AdminCard>
        {pagination && pagination.pages > 1 && (
          <div className="mt-4">
            <Pagination
              page={pagination.page}
              totalPages={pagination.pages}
              total={pagination.total}
              size={pagination.size}
              onChange={setPage}
            />
          </div>
        )}
      </div>
    </>
  );
}
