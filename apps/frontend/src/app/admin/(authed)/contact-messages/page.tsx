// apps/frontend/src/app/admin/(authed)/contact-messages/page.tsx
// Contact messages list — refined design with bulk-actions, search, exports.

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Circle, Mail, ArrowRight } from "lucide-react";
import {
  AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty,
  Pagination, FilterToolbar,
} from "@/components/admin";
import { listAdminContactMessages, updateAdminContactMessage } from "@/services/contact";
import type { ContactMessageAdmin, Pagination as PaginationInfo } from "@/types";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { exportCsv, exportJson, printNode } from "@/utils/exporters";

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
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof listAdminContactMessages>[0] = { page, size: PAGE_SIZE, q: q || undefined };
      if (handled === "unhandled") params.is_handled = false;
      else if (handled === "handled") params.is_handled = true;
      const res = await listAdminContactMessages(params);
      setItems(res.items);
      setPagination(res.pagination);
      setSelected(new Set());
    } catch (err) {
      pushToast("error", "Could not load messages", err instanceof ApiError ? err.message : "Network error");
      setItems([]);
    } finally { setLoading(false); }
  }, [page, handled, q, pushToast]);

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => { setPage(1); }, [handled, q]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function markSelected(asHandled: boolean) {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    try {
      await Promise.all(ids.map((id) => updateAdminContactMessage(id, { is_handled: asHandled })));
      pushToast("success", `${ids.length} ${ids.length === 1 ? "message" : "messages"} updated`);
      void reload();
    } catch (err) {
      pushToast("error", "Bulk update failed", err instanceof ApiError ? err.message : "Network error");
    }
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations"
        title="Contact messages"
        description="Messages submitted via the public contact form."
      />
      <div className="p-6 space-y-4">
        <FilterToolbar
          searchValue={q}
          onSearchChange={setQ}
          searchPlaceholder="Search name, email, message…"
          filters={
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
          }
          exports={{
            onCsv: () => items && exportCsv(items.map((m) => ({
              name: m.name, email: m.email, phone: m.phone ?? "",
              category: m.subject_category, message: m.message,
              handled: m.is_handled ? "yes" : "no", created_at: m.created_at,
            })), `messages-${new Date().toISOString().slice(0, 10)}.csv`),
            onJson: () => items && exportJson(items, `messages-${Date.now()}.json`),
            onPrint: () => printNode(document.getElementById("messages-printable")),
          }}
        />

        {selected.size > 0 && (
          <div className="flex items-center justify-between gap-3 border border-[#A8865A] bg-[#FBF7F0] px-4 py-2.5">
            <p className="text-[12.5px] text-[#86683F]">
              <span className="font-semibold">{selected.size}</span> {selected.size === 1 ? "message" : "messages"} selected
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => markSelected(true)}
                className="flex h-8 items-center gap-1.5 border border-emerald-200 bg-white px-2.5 text-[11.5px] font-medium text-emerald-700 hover:bg-emerald-50"
              >
                <CheckCircle2 className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
                Mark handled
              </button>
              <button
                type="button"
                onClick={() => markSelected(false)}
                className="flex h-8 items-center gap-1.5 border border-slate-300 bg-white px-2.5 text-[11.5px] font-medium text-slate-700 hover:bg-slate-50"
              >
                <Circle className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
                Mark unhandled
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="h-8 px-2.5 text-[11.5px] font-medium text-slate-500 hover:text-slate-900"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div id="messages-printable">
          <AdminCard
            flush
            title={`${pagination?.total ?? 0} ${pagination?.total === 1 ? "message" : "messages"}`}
          >
            <AdminTable columns={["", "", "From", "Category", "Message", "Received", ""]}>
              {loading ? (
                <AdminTableEmpty message="Loading…" />
              ) : !items || items.length === 0 ? (
                <AdminTableEmpty message="No messages found." />
              ) : (
                items.map((m) => (
                  <AdminTableRow key={m.id}>
                    <AdminTableCell className="w-8 align-top">
                      <input
                        type="checkbox"
                        aria-label="Select"
                        checked={selected.has(m.id)}
                        onChange={() => toggle(m.id)}
                        className="h-3.5 w-3.5"
                      />
                    </AdminTableCell>
                    <AdminTableCell className="w-8 align-top">
                      {m.is_handled ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" aria-label="Handled" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 text-amber-500" aria-label="Unhandled" />
                      )}
                    </AdminTableCell>
                    <AdminTableCell className="align-top">
                      <Link href={`/admin/contact-messages/${m.id}`} className="font-medium text-slate-900 hover:underline">
                        {m.name}
                      </Link>
                      <p className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Mail className="h-2.5 w-2.5" aria-hidden="true" />
                        {m.email}
                      </p>
                    </AdminTableCell>
                    <AdminTableCell className="align-top">
                      <span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-700">
                        {m.subject_category}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell className="align-top">
                      <p className="line-clamp-2 max-w-md text-[12px] text-slate-600">{m.message}</p>
                    </AdminTableCell>
                    <AdminTableCell className="align-top">
                      <time dateTime={m.created_at} className="text-[11px] tabular-nums text-slate-500" title={m.created_at}>
                        {new Date(m.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </time>
                    </AdminTableCell>
                    <AdminTableCell className="align-top text-right">
                      <Link
                        href={`/admin/contact-messages/${m.id}`}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-700 hover:text-slate-900"
                      >
                        Open <ArrowRight className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
                      </Link>
                    </AdminTableCell>
                  </AdminTableRow>
                ))
              )}
            </AdminTable>
          </AdminCard>
        </div>

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
