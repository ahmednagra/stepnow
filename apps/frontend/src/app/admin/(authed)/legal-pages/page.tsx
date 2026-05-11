// src/app/admin/(authed)/legal-pages/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, FileText, CheckCircle2, FilePen } from "lucide-react";
import {
  AdminPageHeader,
  AdminCard,
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  AdminTableEmpty,
} from "@/components/admin";
import { ApiError } from "@/lib/api-errors";
import { listAdminLegalPages } from "@/services/legalPages";
import type { LegalPageAdmin } from "@/types";
import { useAdminToast } from "@/hooks/useAdminToast";

type ListFilter = "active" | "deleted" | "all";

export default function LegalPagesListPage() {
  const pushToast = useAdminToast((s) => s.push);
  const [items, setItems] = useState<LegalPageAdmin[] | null>(null);
  const [filter, setFilter] = useState<ListFilter>("active");
  const [loading, setLoading] = useState(true);

  async function reload(f: ListFilter = filter) {
    setLoading(true);
    try {
      const res = await listAdminLegalPages({ include_deleted: f !== "active" });
      const filtered =
        f === "deleted" ? res.items.filter((p) => p.is_deleted) : res.items;
      setItems(filtered);
    } catch (err) {
      pushToast(
        "error",
        "Could not load legal pages",
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
        title="Legal pages"
        description="Impressum, Datenschutz, AGB and other long-form legal content."
        actions={
          <Link
            href="/admin/legal-pages/new"
            className="flex h-9 items-center gap-1.5 bg-slate-900 px-3 text-[13px] font-medium text-white transition-colors hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New legal page
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
            items?.length === 1 ? "page" : "pages"
          }`}
        >
          <AdminTable columns={["Slug", "Published title", "Status", "Updated", ""]}>
            {loading ? (
              <AdminTableEmpty message="Loading…" />
            ) : !items || items.length === 0 ? (
              <AdminTableEmpty message="No legal pages found." />
            ) : (
              items.map((p) => (
                <AdminTableRow key={p.id} className={p.is_deleted ? "opacity-60" : ""}>
                  <AdminTableCell>
                    <Link
                      href={`/admin/legal-pages/${p.slug}`}
                      className="flex items-center gap-2 font-mono text-[12px] font-medium text-slate-900 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      {p.slug}
                    </Link>
                  </AdminTableCell>
                  <AdminTableCell>
                    {p.published_version ? (
                      <>
                        <p className="text-[12px] text-slate-900">{p.published_version.title_de}</p>
                        <p className="text-[11px] text-slate-500">{p.published_version.title_en}</p>
                      </>
                    ) : (
                      <span className="text-[11px] italic text-slate-400">Not yet published</span>
                    )}
                  </AdminTableCell>
                  <AdminTableCell>
                    <div className="flex flex-col gap-1">
                      {p.published_version ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Published v{p.published_version.version_number}
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                          Draft only
                        </span>
                      )}
                      {p.draft_version && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700">
                          <FilePen className="h-2.5 w-2.5" />
                          Unpublished draft
                        </span>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <time
                      dateTime={p.updated_at}
                      className="text-[11px] text-slate-500"
                      title={p.updated_at}
                    >
                      {new Date(p.updated_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <Link
                      href={`/admin/legal-pages/${p.slug}`}
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
