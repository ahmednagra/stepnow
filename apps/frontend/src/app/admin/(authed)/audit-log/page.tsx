// apps/frontend/src/app/admin/(authed)/audit-log/page.tsx
// Audit log — search, filter by table, paginate, CSV export.

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty,
  Pagination, FilterToolbar,
} from "@/components/admin";
import { listAuditLog } from "@/services/auditLog";
import type { AuditLogEntry, Pagination as PaginationInfo } from "@/types";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { exportCsv, exportJson } from "@/utils/exporters";

const PAGE_SIZE = 50;

export default function AuditLogPage() {
  const pushToast = useAdminToast((s) => s.push);
  const [items, setItems] = useState<AuditLogEntry[] | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [actorEmail, setActorEmail] = useState("");
  const [table, setTable] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAuditLog({
        page, size: PAGE_SIZE,
        actor_email: actorEmail || undefined,
        table_name: table || undefined,
      });
      setItems(res.items);
      setPagination(res.pagination);
    } catch (err) {
      pushToast("error", "Could not load audit log", err instanceof ApiError ? err.message : "Network error");
      setItems([]);
    } finally { setLoading(false); }
  }, [page, actorEmail, table, pushToast]);

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => { setPage(1); }, [actorEmail, table]);

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
            <select
              value={table}
              onChange={(e) => setTable(e.target.value)}
              className="h-8 border border-slate-300 bg-white px-2 text-[12px] text-slate-700"
              aria-label="Filter by table"
            >
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
            onCsv: () => items && exportCsv(items.map((e) => ({
              created_at: e.created_at, actor: e.actor_email ?? "system",
              action: e.action, table: e.table_name, record_id: e.record_id ?? "",
            })), `audit-log-${new Date().toISOString().slice(0, 10)}.csv`),
            onJson: () => items && exportJson(items, `audit-log-${Date.now()}.json`),
            onPrint: () => window.print(),
          }}
        />
        <AdminCard flush title={`${pagination?.total ?? 0} entries`}>
          <AdminTable columns={["When", "Actor", "Action", "Table", "Record"]} stickyHeader>
            {loading ? (
              <AdminTableEmpty message="Loading…" />
            ) : !items || items.length === 0 ? (
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
