// src/app/admin/(authed)/testimonials/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Star } from "lucide-react";
import {
  AdminPageHeader,
  AdminCard,
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  AdminTableEmpty,
} from "@/components/admin";
import { ApiError } from "@/lib/api-errors";
import { listAdminTestimonials } from "@/services/testimonials";
import type { TestimonialAdmin } from "@/types";
import { useAdminToast } from "@/hooks/useAdminToast";

type ListFilter = "active" | "deleted" | "all";

export default function TestimonialsListPage() {
  const pushToast = useAdminToast((s) => s.push);
  const [items, setItems] = useState<TestimonialAdmin[] | null>(null);
  const [filter, setFilter] = useState<ListFilter>("active");
  const [loading, setLoading] = useState(true);

  async function reload(f: ListFilter = filter) {
    setLoading(true);
    try {
      const res = await listAdminTestimonials({
        size: 100,
        include_deleted: f !== "active",
      });
      const filtered =
        f === "deleted" ? res.items.filter((t) => t.is_deleted) : res.items;
      setItems(filtered);
    } catch (err) {
      pushToast(
        "error",
        "Could not load testimonials",
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
        title="Testimonials"
        description="Customer quotes shown on the public site."
        actions={
          <Link
            href="/admin/testimonials/new"
            className="flex h-9 items-center gap-1.5 bg-slate-900 px-3 text-[13px] font-medium text-white transition-colors hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New testimonial
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
          title={`${items?.length ?? 0} ${
            items?.length === 1 ? "testimonial" : "testimonials"
          }`}
        >
          <AdminTable columns={["Author", "Quote (DE)", "Rating", "Status", ""]}>
            {loading ? (
              <AdminTableEmpty message="Loading…" />
            ) : !items || items.length === 0 ? (
              <AdminTableEmpty message="No testimonials found." />
            ) : (
              items.map((t) => (
                <AdminTableRow key={t.id} className={t.is_deleted ? "opacity-60" : ""}>
                  <AdminTableCell>
                    <Link
                      href={`/admin/testimonials/${t.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {t.author_name}
                    </Link>
                    {t.author_role_de && (
                      <p className="text-[11px] text-slate-500">{t.author_role_de}</p>
                    )}
                  </AdminTableCell>
                  <AdminTableCell>
                    <p className="line-clamp-2 max-w-md text-[12px] text-slate-600">
                      {t.quote_de}
                    </p>
                  </AdminTableCell>
                  <AdminTableCell>
                    {t.rating != null ? (
                      <span className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">—</span>
                    )}
                  </AdminTableCell>
                  <AdminTableCell>
                    <span
                      className={
                        t.is_deleted
                          ? "inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500"
                          : t.active
                            ? "inline-block bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700"
                            : "inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500"
                      }
                    >
                      {t.is_deleted ? "Deleted" : t.active ? "Active" : "Inactive"}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <Link
                      href={`/admin/testimonials/${t.id}`}
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
