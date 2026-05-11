// src/app/admin/(authed)/services/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Eye, EyeOff } from "lucide-react";
import {
  AdminPageHeader,
  AdminCard,
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  AdminTableEmpty,
} from "@/components/admin";
import { ApiError } from "@/lib/api-errors";
import { listAdminServices } from "@/services/services";
import type { ServiceAdmin } from "@/types";
import { useAdminToast } from "@/hooks/useAdminToast";

type ListFilter = "active" | "deleted" | "all";

export default function ServicesListPage() {
  const pushToast = useAdminToast((s) => s.push);
  const [items, setItems] = useState<ServiceAdmin[] | null>(null);
  const [filter, setFilter] = useState<ListFilter>("active");
  const [loading, setLoading] = useState(true);

  async function reload(f: ListFilter = filter) {
    setLoading(true);
    try {
      const res = await listAdminServices({
        size: 100,
        include_deleted: f !== "active",
      });
      const filtered =
        f === "deleted" ? res.items.filter((s) => s.is_deleted) : res.items;
      setItems(filtered);
    } catch (err) {
      pushToast(
        "error",
        "Could not load services",
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
        title="Services"
        description="Service categories shown on the public site."
        actions={
          <Link
            href="/admin/services/new"
            className="flex h-9 items-center gap-1.5 bg-slate-900 px-3 text-[13px] font-medium text-white transition-colors hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New service
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
            items?.length === 1 ? "service" : "services"
          }`}
        >
          <AdminTable columns={["Title", "Slug", "Status", "Sort", "Updated", ""]}>
            {loading ? (
              <AdminTableEmpty message="Loading…" />
            ) : !items || items.length === 0 ? (
              <AdminTableEmpty message="No services found." />
            ) : (
              items.map((s) => (
                <AdminTableRow key={s.id} className={s.is_deleted ? "opacity-60" : ""}>
                  <AdminTableCell>
                    <Link
                      href={`/admin/services/${s.id}`}
                      className="font-medium text-slate-900 hover:underline"
                    >
                      {s.title_de}
                    </Link>
                    <p className="text-[11px] text-slate-500">{s.title_en}</p>
                  </AdminTableCell>
                  <AdminTableCell>
                    <p className="font-mono text-[11px] text-slate-600">{s.slug_de}</p>
                    <p className="font-mono text-[11px] text-slate-400">{s.slug_en}</p>
                  </AdminTableCell>
                  <AdminTableCell>
                    {s.is_deleted ? (
                      <Badge tone="muted">Deleted</Badge>
                    ) : s.active ? (
                      <Badge tone="green">
                        <Eye className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge tone="muted">
                        <EyeOff className="mr-1 h-3 w-3" />
                        Inactive
                      </Badge>
                    )}
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="tabular-nums text-[12px] text-slate-600">
                      {s.sort_order}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <time
                      dateTime={s.updated_at}
                      className="text-[11px] text-slate-500"
                      title={s.updated_at}
                    >
                      {new Date(s.updated_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <Link
                      href={`/admin/services/${s.id}`}
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

function Badge({
  tone,
  children,
}: {
  tone: "green" | "muted";
  children: React.ReactNode;
}) {
  const cls =
    tone === "green"
      ? "inline-flex items-center bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700"
      : "inline-flex items-center bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500";
  return <span className={cls}>{children}</span>;
}
