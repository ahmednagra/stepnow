// src/app/admin/(authed)/audit-log/page.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { Filter, X } from "lucide-react";
import {
  AdminPageHeader,
  AdminCard,
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  AdminTableEmpty,
  Pagination,
} from "@/components/admin";
import { listAuditLog } from "@/services/auditLog";
import type { AuditLogEntry, Pagination as PaginationInfo } from "@/types";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";

const PAGE_SIZE = 50;

interface Filters {
  table_name: string;
  action: string;
  actor_email: string;
  record_id: string;
  from_date: string;
  to_date: string;
}

const EMPTY_FILTERS: Filters = {
  table_name: "",
  action: "",
  actor_email: "",
  record_id: "",
  from_date: "",
  to_date: "",
};

// Known tables for the dropdown. Match backend audit_log.table_name values.
const TABLES = [
  "site_settings",
  "services",
  "vehicles",
  "testimonials",
  "faqs",
  "legal_pages",
  "legal_page_versions",
  "ui_strings",
  "pricing_categories",
  "pricing_items",
  "bookings",
  "contact_messages",
  "admin_users",
];

const ACTIONS = ["create", "update", "delete", "restore", "publish", "rollback", "login", "logout"];

export default function AuditLogPage() {
  const pushToast = useAdminToast((s) => s.push);
  const [items, setItems] = useState<AuditLogEntry[] | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] = useState<Filters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const reload = useCallback(
    async function reload() {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {
          page,
          size: PAGE_SIZE,
        };
        for (const [k, v] of Object.entries(activeFilters)) {
          if (v.trim()) params[k] = v.trim();
        }
        const res = await listAuditLog(params);
        setItems(res.items);
        setPagination(res.pagination);
      } catch (err) {
        pushToast(
          "error",
          "Could not load audit log",
          err instanceof ApiError ? err.message : "Network error",
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [page, activeFilters, pushToast],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  function applyFilters() {
    setActiveFilters(filters);
    setPage(1);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setActiveFilters(EMPTY_FILTERS);
    setPage(1);
  }

  const hasActiveFilters = Object.values(activeFilters).some((v) => v.trim().length > 0);

  return (
    <>
      <AdminPageHeader
        title="Audit log"
        description="Every admin write is recorded here. Read-only."
      />

      <div className="p-6 flex flex-col gap-6">
        {/* Filters */}
        <AdminCard
          title="Filters"
          description="All filters are AND-combined."
          headerActions={
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex h-7 items-center gap-1 border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={applyFilters}
                className="flex h-7 items-center gap-1 bg-slate-900 px-2 text-[11px] font-medium text-white hover:bg-slate-800"
              >
                <Filter className="h-3 w-3" />
                Apply
              </button>
            </div>
          }
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            <FilterField label="Table">
              <select
                value={filters.table_name}
                onChange={(e) => setFilters({ ...filters, table_name: e.target.value })}
                className="h-8 w-full border border-slate-300 bg-white px-2 text-[12px] text-slate-700"
              >
                <option value="">Any table</option>
                {TABLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Action">
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="h-8 w-full border border-slate-300 bg-white px-2 text-[12px] text-slate-700"
              >
                <option value="">Any action</option>
                {ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Actor email">
              <input
                placeholder="admin@step-now.de"
                value={filters.actor_email}
                onChange={(e) => setFilters({ ...filters, actor_email: e.target.value })}
                className="h-8 w-full border border-slate-300 bg-white px-2 text-[12px] text-slate-700"
              />
            </FilterField>
            <FilterField label="Record ID">
              <input
                placeholder="UUID or string ID"
                value={filters.record_id}
                onChange={(e) => setFilters({ ...filters, record_id: e.target.value })}
                className="h-8 w-full border border-slate-300 bg-white px-2 font-mono text-[11px] text-slate-700"
              />
            </FilterField>
            <FilterField label="From date">
              <input
                type="date"
                value={filters.from_date}
                onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                className="h-8 w-full border border-slate-300 bg-white px-2 text-[12px] text-slate-700"
              />
            </FilterField>
            <FilterField label="To date">
              <input
                type="date"
                value={filters.to_date}
                onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                className="h-8 w-full border border-slate-300 bg-white px-2 text-[12px] text-slate-700"
              />
            </FilterField>
          </div>
        </AdminCard>

        {/* Entries table */}
        <AdminCard
          flush
          title={
            pagination
              ? `${pagination.total} ${pagination.total === 1 ? "entry" : "entries"}`
              : "Loading…"
          }
        >
          <AdminTable columns={["When", "Who", "Action", "Target", "Changes"]}>
            {loading ? (
              <AdminTableEmpty message="Loading…" />
            ) : !items || items.length === 0 ? (
              <AdminTableEmpty message="No audit log entries match the filters." />
            ) : (
              items.map((e) => {
                const isExpanded = expandedId === e.id;
                const changeCount = Object.keys(e.changes ?? {}).length;
                return (
                  <AdminTableRow key={e.id}>
                    <AdminTableCell className="align-top">
                      <time
                        dateTime={e.created_at}
                        className="text-[11px] tabular-nums text-slate-600"
                        title={e.created_at}
                      >
                        {new Date(e.created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </AdminTableCell>
                    <AdminTableCell className="align-top">
                      <span className="text-[12px] text-slate-900">
                        {e.actor_email ?? "system"}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell className="align-top">
                      <span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-700">
                        {e.action}
                      </span>
                    </AdminTableCell>
                    <AdminTableCell className="align-top">
                      <p className="font-mono text-[11px] text-slate-700">{e.table_name}</p>
                      {e.record_id && (
                        <p className="font-mono text-[10px] text-slate-500">{e.record_id}</p>
                      )}
                    </AdminTableCell>
                    <AdminTableCell className="align-top">
                      {changeCount === 0 ? (
                        <span className="text-[11px] italic text-slate-400">no diff</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : e.id)}
                          className="text-[11px] font-medium text-slate-700 hover:underline"
                        >
                          {isExpanded
                            ? "Hide diff"
                            : `${changeCount} field${changeCount === 1 ? "" : "s"} changed`}
                        </button>
                      )}
                      {isExpanded && (
                        <pre className="mt-1.5 max-w-2xl overflow-x-auto border border-slate-200 bg-slate-50 p-2 text-[10px] leading-relaxed text-slate-700">
                          {JSON.stringify(e.changes, null, 2)}
                        </pre>
                      )}
                    </AdminTableCell>
                  </AdminTableRow>
                );
              })
            )}
          </AdminTable>
        </AdminCard>

        {pagination && pagination.pages > 1 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.pages}
            total={pagination.total}
            size={pagination.size}
            onChange={setPage}
          />
        )}
      </div>
    </>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase tracking-[0.14em] text-slate-400">{label}</label>
      {children}
    </div>
  );
}
