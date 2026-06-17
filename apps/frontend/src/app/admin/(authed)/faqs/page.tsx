// apps/frontend/src/app/admin/(authed)/faqs/page.tsx
// FAQs list. Search input now debounced 300ms via inline setTimeout cleanup (no new hook file).

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil } from "lucide-react";
import { AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty, PreviewButton, FilterToolbar } from "@/components/admin";
import { useFaqs } from "@/hooks/queries/useFaqs";
import { faqsPreviewUrl } from "@/utils/preview-urls";
import { exportCsv, exportJson } from "@/utils/exporters";

type ListFilter = "active" | "deleted" | "all";

export default function FaqsListPage() {
const [filter, setFilter] = useState<ListFilter>("active");
const [q, setQ] = useState("");
const [debouncedQ, setDebouncedQ] = useState("");

useEffect(() => {
const id = window.setTimeout(() => setDebouncedQ(q), 300);
return () => window.clearTimeout(id);
}, [q]);

const { data, isLoading } = useFaqs({ size: 100, include_deleted: filter !== "active", q: debouncedQ || undefined });
const items = useMemo(() => {
const rows = data?.items ?? [];
return filter === "deleted" ? rows.filter((x) => x.is_deleted) : rows;
}, [data, filter]);

return (
<>
<AdminPageHeader
eyebrow="Content"
title="FAQs"
description="Frequently asked questions shown on the public site."
actions={
<>
<PreviewButton variant="header" url={faqsPreviewUrl()} title="FAQ page" subtitle="/faq" />
<Link href="/admin/faqs/new" className="flex h-9 items-center gap-1.5 bg-slate-900 px-3.5 text-[12.5px] font-medium text-white hover:bg-slate-800">
<Plus className="h-3.5 w-3.5" aria-hidden="true" />
New FAQ
</Link>
</>
}
/>
<div className="p-6">
<AdminCard
flush
title={`${items.length} ${items.length === 1 ? "FAQ" : "FAQs"}`}
headerActions={
<FilterToolbar
searchValue={q}
onSearchChange={setQ}
searchPlaceholder="Search question…"
filters={
<select value={filter} onChange={(e) => setFilter(e.target.value as ListFilter)} className="h-8 border border-slate-300 bg-white px-2 text-[12px] text-slate-700" aria-label="Filter">
<option value="active">Active</option>
<option value="deleted">Deleted</option>
<option value="all">All</option>
</select>
}
exports={{
onCsv: () => exportCsv(items.map((x) => ({
question_de: x.question_de, answer_de: x.answer_de,
question_en: x.question_en, answer_en: x.answer_en,
category: x.category ?? "", sort_order: x.sort_order,
})), `faqs-${new Date().toISOString().slice(0, 10)}.csv`),
onJson: () => exportJson(items, `faqs-${Date.now()}.json`),
onPrint: () => window.print(),
}}
/>
}
>
<AdminTable columns={["Question (DE)", "Category", "Status", "Sort", ""]}>
{isLoading ? (
<AdminTableEmpty loading />
) : items.length === 0 ? (
<AdminTableEmpty message="No FAQs found." />
) : (
items.map((x) => (
<AdminTableRow key={x.id} className={x.is_deleted ? "opacity-60" : ""}>
<AdminTableCell>
<Link href={`/admin/faqs/${x.id}`} className="font-medium text-slate-900 hover:underline line-clamp-1">{x.question_de}</Link>
<p className="text-[11px] text-slate-500 line-clamp-1">{x.question_en}</p>
</AdminTableCell>
<AdminTableCell>
{x.category ? (
<span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-700">{x.category}</span>
) : <span className="text-[11px] text-slate-300">—</span>}
</AdminTableCell>
<AdminTableCell>
{x.is_deleted ? (
<span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">Deleted</span>
) : x.active ? (
<span className="inline-block bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700">Active</span>
) : (
<span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">Inactive</span>
)}
</AdminTableCell>
<AdminTableCell>
<span className="tabular-nums text-[12px] text-slate-600">{x.sort_order}</span>
</AdminTableCell>
<AdminTableCell className="text-right">
<div className="flex items-center justify-end gap-1.5">
{!x.is_deleted && x.active && (
<PreviewButton variant="icon" url={faqsPreviewUrl()} title={x.question_de} subtitle="/faq" />
)}
<Link href={`/admin/faqs/${x.id}`} aria-label="Edit" title="Edit" className="grid h-7 w-7 place-items-center border border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-900">
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
