// apps/frontend/src/app/admin/(authed)/services/page.tsx
// Services list. Search input now debounced 300ms via inline setTimeout cleanup (no new hook file).

"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty, PreviewButton, FilterToolbar } from "@/components/admin";
import { ApiError } from "@/lib/api-errors";
import { listAdminServices } from "@/services/services";
import type { ServiceAdmin } from "@/types";
import { useAdminToast } from "@/hooks/useAdminToast";
import { servicePreviewUrl } from "@/utils/preview-urls";
import { exportCsv, exportJson } from "@/utils/exporters";

type ListFilter = "active" | "deleted" | "all";

export default function ServicesListPage() {
const pushToast = useAdminToast((s) => s.push);
const [items, setItems] = useState<ServiceAdmin[] | null>(null);
const [filter, setFilter] = useState<ListFilter>("active");
const [q, setQ] = useState("");
const [loading, setLoading] = useState(true);

const reload = useCallback(async (f: ListFilter, search: string) => {
setLoading(true);
try {
const res = await listAdminServices({ size: 100, include_deleted: f !== "active", q: search || undefined });
const filtered = f === "deleted" ? res.items.filter((s) => s.is_deleted) : res.items;
setItems(filtered);
} catch (err) {
pushToast("error", "Could not load services", err instanceof ApiError ? err.message : "Network error");
setItems([]);
} finally { setLoading(false); }
}, [pushToast]);

useEffect(() => {
const id = window.setTimeout(() => { void reload(filter, q); }, 300);
return () => window.clearTimeout(id);
}, [filter, q, reload]);

const stats = useMemo(() => {
if (!items) return { total: 0, active: 0, deleted: 0 };
return {
total: items.length,
active: items.filter((s) => s.active && !s.is_deleted).length,
deleted: items.filter((s) => s.is_deleted).length,
};
}, [items]);

function doExportCsv() {
if (!items) return;
exportCsv(items.map((s) => ({
title_de: s.title_de, title_en: s.title_en, slug_de: s.slug_de, slug_en: s.slug_en,
active: s.active ? "yes" : "no", sort_order: s.sort_order, updated_at: s.updated_at,
})), `services-${new Date().toISOString().slice(0, 10)}.csv`);
}

return (
<>
<AdminPageHeader
eyebrow="Content"
title="Services"
description="Service categories shown on the public site."
actions={
<Link href="/admin/services/new" className="flex h-9 items-center gap-1.5 bg-slate-900 px-3.5 text-[12.5px] font-medium text-white transition-colors hover:bg-slate-800">
<Plus className="h-3.5 w-3.5" aria-hidden="true" />
New service
</Link>
}
/>
<div className="p-6 space-y-4">
<div className="grid grid-cols-3 gap-3">
<div className="border border-slate-200 bg-white px-4 py-3">
<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total</p>
<p className="mt-1 font-serif text-[22px] font-medium tabular-nums text-slate-900">{stats.total}</p>
</div>
<div className="border border-slate-200 bg-white px-4 py-3">
<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Active</p>
<p className="mt-1 font-serif text-[22px] font-medium tabular-nums text-emerald-700">{stats.active}</p>
</div>
<div className="border border-slate-200 bg-white px-4 py-3">
<p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Deleted</p>
<p className="mt-1 font-serif text-[22px] font-medium tabular-nums text-slate-400">{stats.deleted}</p>
</div>
</div>
<AdminCard
flush
title={`${items?.length ?? 0} ${items?.length === 1 ? "service" : "services"}`}
headerActions={
<FilterToolbar
searchValue={q}
onSearchChange={setQ}
searchPlaceholder="Search title, slug…"
filters={
<select value={filter} onChange={(e) => setFilter(e.target.value as ListFilter)} className="h-8 border border-slate-300 bg-white px-2 text-[12px] text-slate-700 focus:border-slate-900 focus:outline-none" aria-label="Filter">
<option value="active">Active</option>
<option value="deleted">Deleted</option>
<option value="all">All</option>
</select>
}
exports={{
onCsv: doExportCsv,
onJson: () => items && exportJson(items, `services-${Date.now()}.json`),
onPrint: () => window.print(),
}}
/>
}
>
<AdminTable columns={["Title", "Slug", "Status", "Sort", "Updated", ""]}>
{loading ? (
<AdminTableEmpty loading />
) : !items || items.length === 0 ? (
<AdminTableEmpty message="No services found." />
) : (
items.map((s) => (
<AdminTableRow key={s.id} className={s.is_deleted ? "opacity-60" : ""}>
<AdminTableCell>
<Link href={`/admin/services/${s.id}`} className="font-medium text-slate-900 hover:underline">{s.title_de}</Link>
<p className="text-[11px] text-slate-500 line-clamp-1">{s.title_en}</p>
</AdminTableCell>
<AdminTableCell>
<span className="font-mono text-[11px] text-slate-600">{s.slug_de}</span>
</AdminTableCell>
<AdminTableCell>
{s.is_deleted ? (
<span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">Deleted</span>
) : s.active ? (
<span className="inline-block bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700">Active</span>
) : (
<span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">Inactive</span>
)}
</AdminTableCell>
<AdminTableCell>
<span className="tabular-nums text-[12px] text-slate-600">{s.sort_order}</span>
</AdminTableCell>
<AdminTableCell>
<time className="text-[11.5px] tabular-nums text-slate-500" dateTime={s.updated_at}>
{new Date(s.updated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
</time>
</AdminTableCell>
<AdminTableCell className="text-right">
<div className="flex items-center justify-end gap-1.5">
{!s.is_deleted && s.active && (
<PreviewButton variant="icon" url={servicePreviewUrl(s.slug_de, s.slug_en)} title={s.title_de} subtitle={`/dienstleistungen/${s.slug_de}`} />
)}
<Link href={`/admin/services/${s.id}`} aria-label="Edit service" title="Edit" className="grid h-7 w-7 place-items-center border border-slate-200 bg-white text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-900">
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
