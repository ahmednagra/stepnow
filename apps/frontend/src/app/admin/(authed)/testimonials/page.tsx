// apps/frontend/src/app/admin/(authed)/testimonials/page.tsx
// Testimonials list. Search input now debounced 300ms via inline setTimeout cleanup (no new hook file).

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Star } from "lucide-react";
import { AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty, PreviewButton, FilterToolbar } from "@/components/admin";
import { ApiError } from "@/lib/api-errors";
import { listAdminTestimonials } from "@/services/testimonials";
import type { TestimonialAdmin } from "@/types";
import { useAdminToast } from "@/hooks/useAdminToast";
import { testimonialsPreviewUrl, homePreviewUrl } from "@/utils/preview-urls";
import { exportCsv, exportJson } from "@/utils/exporters";

type ListFilter = "active" | "deleted" | "all";

function StarRating({ value }: { value: number | null }) {
if (!value) return <span className="text-[11px] text-slate-300">—</span>;
return (
<span className="inline-flex items-center gap-0.5" aria-label={`${value} of 5`}>
{Array.from({ length: 5 }).map((_, i) => (
<Star key={i} className={i < value ? "h-3 w-3 fill-[#A8865A] text-[#A8865A]" : "h-3 w-3 text-slate-200"} strokeWidth={1.5} aria-hidden="true" />
))}
</span>
);
}

export default function TestimonialsListPage() {
const pushToast = useAdminToast((s) => s.push);
const [items, setItems] = useState<TestimonialAdmin[] | null>(null);
const [filter, setFilter] = useState<ListFilter>("active");
const [q, setQ] = useState("");
const [loading, setLoading] = useState(true);

const reload = useCallback(async (f: ListFilter, search: string) => {
setLoading(true);
try {
const res = await listAdminTestimonials({ size: 100, include_deleted: f !== "active", q: search || undefined });
const filtered = f === "deleted" ? res.items.filter((t) => t.is_deleted) : res.items;
setItems(filtered);
} catch (err) {
pushToast("error", "Could not load testimonials", err instanceof ApiError ? err.message : "Network error");
setItems([]);
} finally { setLoading(false); }
}, [pushToast]);

useEffect(() => {
const id = window.setTimeout(() => { void reload(filter, q); }, 300);
return () => window.clearTimeout(id);
}, [filter, q, reload]);

return (
<>
<AdminPageHeader
eyebrow="Content"
title="Testimonials"
description="Customer quotes shown on the public site."
actions={
<>
<PreviewButton variant="header" url={homePreviewUrl()} title="Homepage testimonials" subtitle="/" />
<Link href="/admin/testimonials/new" className="flex h-9 items-center gap-1.5 bg-slate-900 px-3.5 text-[12.5px] font-medium text-white hover:bg-slate-800">
<Plus className="h-3.5 w-3.5" aria-hidden="true" />
New testimonial
</Link>
</>
}
/>
<div className="p-6">
<AdminCard
flush
title={`${items?.length ?? 0} ${items?.length === 1 ? "testimonial" : "testimonials"}`}
headerActions={
<FilterToolbar
searchValue={q}
onSearchChange={setQ}
searchPlaceholder="Search author, quote…"
filters={
<select value={filter} onChange={(e) => setFilter(e.target.value as ListFilter)} className="h-8 border border-slate-300 bg-white px-2 text-[12px] text-slate-700" aria-label="Filter">
<option value="active">Active</option>
<option value="deleted">Deleted</option>
<option value="all">All</option>
</select>
}
exports={{
onCsv: () => items && exportCsv(items.map((t) => ({
author: t.author_name, role_de: t.author_role_de, quote_de: t.quote_de,
quote_en: t.quote_en, rating: t.rating ?? "", active: t.active ? "yes" : "no",
})), `testimonials-${new Date().toISOString().slice(0, 10)}.csv`),
onJson: () => items && exportJson(items, `testimonials-${Date.now()}.json`),
onPrint: () => window.print(),
}}
/>
}
>
<AdminTable columns={["Author", "Quote", "Rating", "Status", ""]}>
{loading ? (
<AdminTableEmpty loading />
) : !items || items.length === 0 ? (
<AdminTableEmpty message="No testimonials found." />
) : (
items.map((t) => (
<AdminTableRow key={t.id} className={t.is_deleted ? "opacity-60" : ""}>
<AdminTableCell>
<Link href={`/admin/testimonials/${t.id}`} className="font-medium text-slate-900 hover:underline">{t.author_name}</Link>
{t.author_role_de && (<p className="text-[11px] text-slate-500">{t.author_role_de}</p>)}
</AdminTableCell>
<AdminTableCell>
<div className="flex max-w-md flex-col gap-1">
<p className="line-clamp-2 text-[12.5px] italic text-slate-700">
<span className="mr-1 inline-block text-[9px] font-semibold uppercase tracking-[0.14em] not-italic text-slate-400">DE</span>
&ldquo;{t.quote_de}&rdquo;
</p>
<p className="line-clamp-2 text-[11.5px] italic text-slate-500">
<span className="mr-1 inline-block text-[9px] font-semibold uppercase tracking-[0.14em] not-italic text-slate-400">EN</span>
&ldquo;{t.quote_en}&rdquo;
</p>
</div>
</AdminTableCell>
<AdminTableCell><StarRating value={t.rating} /></AdminTableCell>
<AdminTableCell>
{t.is_deleted ? (
<span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">Deleted</span>
) : t.active ? (
<span className="inline-block bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700">Active</span>
) : (
<span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">Inactive</span>
)}
</AdminTableCell>
<AdminTableCell className="text-right">
<div className="flex items-center justify-end gap-1.5">
{!t.is_deleted && t.active && (
<PreviewButton variant="icon" url={testimonialsPreviewUrl()} title={t.author_name} subtitle="/referenzen" />
)}
<Link href={`/admin/testimonials/${t.id}`} aria-label="Edit" title="Edit" className="grid h-7 w-7 place-items-center border border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-900">
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
