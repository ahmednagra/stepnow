// apps/frontend/src/app/admin/(authed)/vehicles/page.tsx
// Vehicles list. Adds debounced search, preview, exports, refined design.

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import {
  AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty,
  PreviewButton, FilterToolbar,
} from "@/components/admin";
import { ApiError } from "@/lib/api-errors";
import { listAdminVehicles } from "@/services/vehicles";
import type { VehicleAdmin } from "@/types";
import { useAdminToast } from "@/hooks/useAdminToast";
import { vehiclesPreviewUrl } from "@/utils/preview-urls";
import { exportCsv, exportJson } from "@/utils/exporters";

type ListFilter = "active" | "deleted" | "all";

export default function VehiclesListPage() {
  const pushToast = useAdminToast((s) => s.push);
  const [items, setItems] = useState<VehicleAdmin[] | null>(null);
  const [filter, setFilter] = useState<ListFilter>("active");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async (f: ListFilter, search: string) => {
    setLoading(true);
    try {
      const res = await listAdminVehicles({
        size: 100,
        include_deleted: f !== "active",
        q: search || undefined,
      });
      const filtered = f === "deleted" ? res.items.filter((v) => v.is_deleted) : res.items;
      setItems(filtered);
    } catch (err) {
      pushToast("error", "Could not load vehicles", err instanceof ApiError ? err.message : "Network error");
      setItems([]);
    } finally { setLoading(false); }
  }, [pushToast]);

  useEffect(() => { void reload(filter, q); }, [filter, q, reload]);

  const stats = useMemo(() => {
    if (!items) return { total: 0, active: 0, capacity: 0 };
    return {
      total: items.length,
      active: items.filter((v) => v.active && !v.is_deleted).length,
      capacity: items.filter((v) => v.active && !v.is_deleted).reduce((s, v) => s + v.capacity_passengers, 0),
    };
  }, [items]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Content"
        title="Vehicles"
        description="Fleet shown on the public site."
        actions={
          <>
            <PreviewButton variant="header" url={vehiclesPreviewUrl()} title="Vehicles" subtitle="/fahrzeuge" />
            <Link
              href="/admin/vehicles/new"
              className="flex h-9 items-center gap-1.5 bg-slate-900 px-3.5 text-[12.5px] font-medium text-white transition-colors hover:bg-slate-800"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              New vehicle
            </Link>
          </>
        }
      />
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Fleet size</p>
            <p className="mt-1 font-serif text-[22px] font-medium tabular-nums text-slate-900">{stats.total}</p>
          </div>
          <div className="border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Active</p>
            <p className="mt-1 font-serif text-[22px] font-medium tabular-nums text-emerald-700">{stats.active}</p>
          </div>
          <div className="border border-slate-200 bg-white px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total capacity</p>
            <p className="mt-1 font-serif text-[22px] font-medium tabular-nums text-slate-900">{stats.capacity}<span className="text-[12px] ml-1 text-slate-500">pax</span></p>
          </div>
        </div>

        <AdminCard
          flush
          title={`${items?.length ?? 0} ${items?.length === 1 ? "vehicle" : "vehicles"}`}
          headerActions={
            <FilterToolbar
              searchValue={q}
              onSearchChange={setQ}
              searchPlaceholder="Search name, category…"
              filters={
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
              exports={{
                onCsv: () => items && exportCsv(items.map((v) => ({
                  name_de: v.name_de, name_en: v.name_en, category: v.category,
                  passengers: v.capacity_passengers, luggage: v.capacity_luggage,
                  active: v.active ? "yes" : "no", sort_order: v.sort_order,
                })), `vehicles-${new Date().toISOString().slice(0, 10)}.csv`),
                onJson: () => items && exportJson(items, `vehicles-${Date.now()}.json`),
                onPrint: () => window.print(),
              }}
            />
          }
        >
          <AdminTable columns={["Vehicle", "Category", "Capacity", "Status", "Sort", ""]}>
            {loading ? (
              <AdminTableEmpty loading />
            ) : !items || items.length === 0 ? (
              <AdminTableEmpty message="No vehicles found." />
            ) : (
              items.map((v) => (
                <AdminTableRow key={v.id} className={v.is_deleted ? "opacity-60" : ""}>
                  <AdminTableCell>
                    <div className="flex items-center gap-3">
                      {v.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.image_url} alt="" className="h-10 w-14 shrink-0 object-cover bg-slate-100" loading="lazy" />
                      ) : (
                        <div className="h-10 w-14 shrink-0 bg-slate-100" aria-hidden="true" />
                      )}
                      <div className="min-w-0">
                        <Link href={`/admin/vehicles/${v.id}`} className="font-medium text-slate-900 hover:underline">
                          {v.name_de}
                        </Link>
                        <p className="text-[11px] text-slate-500 truncate">{v.name_en}</p>
                      </div>
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-700">
                      {v.category}
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="text-[12px] tabular-nums text-slate-700">
                      {v.capacity_passengers}p · {v.capacity_luggage}l
                    </span>
                  </AdminTableCell>
                  <AdminTableCell>
                    {v.is_deleted ? (
                      <span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">Deleted</span>
                    ) : v.active ? (
                      <span className="inline-block bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700">Active</span>
                    ) : (
                      <span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">Inactive</span>
                    )}
                  </AdminTableCell>
                  <AdminTableCell>
                    <span className="tabular-nums text-[12px] text-slate-600">{v.sort_order}</span>
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!v.is_deleted && v.active && (
                        <PreviewButton
                          variant="icon"
                          url={vehiclesPreviewUrl()}
                          title={v.name_de}
                          subtitle={`/fahrzeuge`}
                        />
                      )}
                      <Link
                        href={`/admin/vehicles/${v.id}`}
                        aria-label="Edit"
                        title="Edit"
                        className="grid h-7 w-7 place-items-center border border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-900"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                      </Link>
                    </div>
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
