// app/admin/(authed)/customers/page.tsx
// Customers list + search. Mirrors the orders list (FilterToolbar + AdminTable + Pagination).

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty,
  FilterToolbar, Pagination,
} from "@/components/admin";
import { Badge } from "@/components/ui/Badge";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { listAdminCustomers, type CustomerAdmin } from "@/services/customers";

const PAGE_SIZE = 20;

export default function CustomersPage() {
  const pushToast = useAdminToast((s) => s.push);
  const [rows, setRows] = useState<CustomerAdmin[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminCustomers({ page, size: PAGE_SIZE, q: q || undefined });
      setRows(res.items); setPages(res.pagination.pages); setTotal(res.pagination.total);
    } catch (err) {
      pushToast("error", "Could not load customers", err instanceof ApiError ? err.message : "Network error");
    } finally { setLoading(false); }
  }, [page, q, pushToast]);

  useEffect(() => { void reload(); }, [reload]);

  return (
    <>
      <AdminPageHeader eyebrow="Operations" title="Customers" description="Senders / billers for repeat courier jobs." />
      <div className="space-y-4 p-6">
        <FilterToolbar searchValue={q} onSearchChange={(v: string) => { setPage(1); setQ(v); }} searchPlaceholder="Search name, company, phone…" />
        <AdminCard flush title={`${total} ${total === 1 ? "customer" : "customers"}`}>
          <AdminTable columns={["Name", "Company", "City", "Phone", "Type"]}>
            {loading ? (
              <AdminTableEmpty loading />
            ) : rows && rows.length > 0 ? (
              rows.map((c) => (
                <AdminTableRow key={c.id}>
                  <AdminTableCell><Link href={`/admin/customers/${c.id}`} className="font-semibold text-slate-900 hover:underline">{c.first_name} {c.last_name}</Link></AdminTableCell>
                  <AdminTableCell>{c.company_name ?? "—"}</AdminTableCell>
                  <AdminTableCell>{[c.plz, c.ort].filter(Boolean).join(" ") || "—"}</AdminTableCell>
                  <AdminTableCell>{c.phone ?? "—"}</AdminTableCell>
                  <AdminTableCell><Badge tone={c.is_business ? "gold" : "neutral"}>{c.is_business ? "Business" : "Private"}</Badge></AdminTableCell>
                </AdminTableRow>
              ))
            ) : (
              <AdminTableEmpty message="No customers yet." />
            )}
          </AdminTable>
        </AdminCard>
        <Pagination page={page} totalPages={pages} totalItems={total} onPageChange={setPage} />
      </div>
    </>
  );
}
