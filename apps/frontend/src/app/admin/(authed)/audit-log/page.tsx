// apps/frontend/src/app/admin/(authed)/audit-log/page.tsx
// Audit log. Data via useAuditLog (React Query); actor-email search debounced 300ms via inline setTimeout.

"use client";

import { useEffect, useState } from "react";
import { AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty, Pagination, FilterToolbar } from "@/components/admin";
import { useAuditLog } from "@/hooks/queries/useAuditLog";
import { exportCsv, exportJson } from "@/utils/exporters";

const PAGE_SIZE = 50;

export default function AuditLogPage() {
const [page, setPage] = useState(1);
const [actorEmail, setActorEmail] = useState("");
const [debouncedActor, setDebouncedActor] = useState("");
const [table, setTable] = useState("");

useEffect(() => {
const id = window.setTimeout(() => setDebouncedActor(actorEmail), 300);
return () => window.clearTimeout(id);
}, [actorEmail]);

useEffect(() => { setPage(1); }, [debouncedActor, table]);

const { data, isLoading } = useAuditLog({
page, size: PAGE_SIZE,
actor_email: debouncedActor || undefined,
table_name: table || undefined,
});
const items = data?.items ?? [];
const pagination = data?.pagination ?? null;

return (
<>
<AdminPageHeader
eyebrow="System"
title="Audit log"
description="Every admin action — read-only. Filter by table or search by actor."
/>
<div className="p-6 space-y-4">
<FilterToolbar
searchValue={actorEmail}
onSearchChange={setActorEmail}
searchPlaceholder="Filter by actor email…"
filters={
<select value={table} onChange={(e) => setTable(e.target.value)} className="h-8 border border-slate-300 bg-white px-2 text-[12px] text-slate-700" aria-label="Filter by table">
<option value="">All tables</option>
<option value="services">Services</option>
<option value="vehicles">Vehicles</option>
<option value="testimonials">Testimonials</option>
<option value="faqs">FAQs</option>
<option value="pricing_categories">Pricing categories</option>
<option value="pricing_items">Pricing items</option>
<option value="legal_pages">Legal pages</option>
<option value="legal_page_versions">Legal page versions</option>
<option value="bookings">Bookings</option>
<option value="contact_messages">Contact messages</option>
<option value="site_settings">Settings</option>
<option value="ui_strings">UI strings</option>
</select>
}
exports={{
onCsv: () => items.length > 0 && exportCsv(items.map((e) => ({
created_at: e.created_at, actor: e.actor_email ?? "system",
action: e.action, table: e.table_name, record_id: e.record_id ?? "",
})), `audit-log-${new Date().toISOString().slice(0, 10)}.csv`),
onJson: () => items.length > 0 && exportJson(items, `audit-log-${Date.now()}.json`),
onPrint: () => window.print(),
}}
/>
<AdminCard flush title={`${pagination?.total ?? 0} entries`}>
<AdminTable columns={["When", "Actor", "Action", "Table", "Record"]} stickyHeader>
{isLoading ? (
<AdminTableEmpty message="Loading…" />
) : items.length === 0 ? (
<AdminTableEmpty message="No audit entries match." />
) : (
items.map((e) => (
<AdminTableRow key={e.id}>
<AdminTableCell>
<time dateTime={e.created_at} className="text-[11.5px] tabular-nums text-slate-700">
{new Date(e.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
</time>
</AdminTableCell>
<AdminTableCell>
<span className="text-[12px] text-slate-700">
{e.actor_email || <span className="text-slate-400">system</span>}
</span>
</AdminTableCell>
<AdminTableCell>
<span className="bg-[#F5F2EC] px-1.5 py-0.5 font-mono text-[11px] text-[#86683F]">{e.action}</span>
</AdminTableCell>
<AdminTableCell>
<span className="font-mono text-[11px] text-slate-600">{e.table_name}</span>
</AdminTableCell>
<AdminTableCell>
{e.record_id && <span className="font-mono text-[10.5px] text-slate-400">{e.record_id.slice(0, 12)}…</span>}
</AdminTableCell>
</AdminTableRow>
))
)}
</AdminTable>
</AdminCard>
{pagination && pagination.pages > 1 && (
<Pagination page={pagination.page} totalPages={pagination.pages} totalItems={pagination.total} onPageChange={setPage} />
)}
</div>
</>
);
}
