// src/app/admin/(authed)/faqs/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  AdminPageHeader,
  AdminCard,
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  AdminTableEmpty,
} from "@/components/admin";
import { ApiError } from "@/lib/api-errors";
import { listAdminFaqs } from "@/services/faqs";
import type { FaqAdmin } from "@/types";
import { useAdminToast } from "@/hooks/useAdminToast";

type ListFilter = "active" | "deleted" | "all";

export default function FaqsListPage() {
  const pushToast = useAdminToast((s) => s.push);
  const [items, setItems] = useState<FaqAdmin[] | null>(null);
  const [filter, setFilter] = useState<ListFilter>("active");
  const [loading, setLoading] = useState(true);

  async function reload(f: ListFilter = filter) {
    setLoading(true);
    try {
      const res = await listAdminFaqs({
        size: 200,
        include_deleted: f !== "active",
      });
      const filtered =
        f === "deleted" ? res.items.filter((q) => q.is_deleted) : res.items;
      setItems(filtered);
    } catch (err) {
      pushToast(
        "error",
        "Could not load FAQs",
        err instanceof ApiError ? err.message : "Network error",
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <>
      <AdminPageHeader
        title="FAQs"
        description="Frequently asked questions shown on the public site."
        actions={
          <Link
            href="/admin/faqs/new"
            className="flex h-9 items-center gap-1.5 bg-slate-900 px-3 text-[13px] font-medium text-white transition-colors hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New FAQ
          </Link>
        }
      />
      <div className="p-6">
        <AdminCard
          flush
          headerActions={
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as ListFilter)}
              className="h-8 border border-slate-300 bg-white px-2 text-[12px] text-slate-700"
              aria-label="Filter"
            >
              <option value="active">Active</option>
              <option value="deleted">Deleted</option>
              <option value="all">All</option>
            </select>
          }
          title={`${items?.length ?? 0} ${items?.length === 1 ? "FAQ" : "FAQs"}`}
        >
          <AdminTable columns={["Question (DE)", "Category", "Status", "Sort", ""]}>
            {loading ? (
              <AdminTableEmpty message="Loading…" />
            ) : !items || items.length === 0 ? (
              <AdminTableEmpty message="No FAQs found." />
            ) : (
              items.map((q) => (
                <AdminTableRow key={q.id} className={q.is_deleted ? "opacity-60" : ""}>
                  <AdminTableCell>
                    <Link
                      href={`/admin/faqs/${q.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {q.question_de}
                    </Link>
                    <p className="line-clamp-1 text-[11px] text-slate-500">{q.question_en}</p>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-700">
                      {q.category}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span
                      className={
                        q.is_deleted
                          ? "inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500"
                          : q.active
                            ? "inline-block bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700"
                            : "inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500"
                      }
                    >
                      {q.is_deleted ? "Deleted" : q.active ? "Active" : "Inactive"}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="tabular-nums text-[12px] text-slate-600">{q.sort_order}</span>
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <Link
                      href={`/admin/faqs/${q.id}`}
                      className="text-[12px] font-medium text-slate-700 hover:text-slate-900"
                    >
                      Edit →
                    </Link>
                  </AdminTableCell>
                </AdminTableRow>
              ))
            )}
          </AdminTable>
        </AdminCard>
      </div>
    </>
  );
}
