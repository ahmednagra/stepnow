// apps/frontend/src/app/admin/(authed)/invoices/page.tsx
// Bills (Rechnungen) console — list of all invoices with customer, route, amount, paid state,
// and CSV/Excel export. Each row links to the bill editor. Built on the admin design system.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { AdminPageHeader, AdminCard, FilterToolbar, Pagination } from "@/components/admin";
import { useDefaultCurrency, useInvoices } from "@/hooks/queries";
import { formatMoney } from "@/utils/decimal";
import { exportCsv } from "@/utils/exporters";
import { cn } from "@/utils/cn";

const PAGE_SIZE = 20;
const num = (s: string | null | undefined) => Number(s ?? "0") || 0;
const deDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "2-digit" }) : "—";

export default function InvoicesPage() {
  const cur = useDefaultCurrency();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("all");
  const { data, isLoading, isError } = useInvoices({
    page, size: PAGE_SIZE, q: q || undefined, status: status === "all" ? undefined : status,
  });
  const rows = data?.items ?? [];

  const exportRows = useMemo(
    () => rows.map((b) => ({
      bill_no: b.invoice_number,
      customer: b.customer_name,
      from: b.route_from ?? "",
      to: b.route_to ?? "",
      issue_date: b.issue_date,
      due_date: b.due_date ?? "",
      status: b.status,
      gross: num(b.gross_amount).toFixed(2),
      paid: num(b.amount_paid).toFixed(2),
      balance: num(b.balance_due).toFixed(2),
    })),
    [rows],
  );

  return (
    <>
      <AdminPageHeader
        title="Bills"
        description="All invoices (Rechnungen). Editing a bill never changes the vehicle accounts."
      />

      <div className="space-y-4 p-6">
        <FilterToolbar
          searchValue={q}
          onSearchChange={(v) => { setQ(v); setPage(1); }}
          searchPlaceholder="Search bill no. or customer…"
          exports={{ onCsv: () => exportCsv(exportRows, `bills-${new Date().toISOString().slice(0, 10)}.csv`) }}
          filters={
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="h-8 border border-slate-300 bg-white px-2 text-[12.5px] text-slate-700 focus:border-slate-900 focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          }
        />

        <AdminCard>
          {isLoading ? (
            <p className="p-6 text-[13px] text-slate-500">Loading bills…</p>
          ) : isError ? (
            <p className="p-6 text-[13px] text-rose-600">Could not load bills.</p>
          ) : rows.length === 0 ? (
            <p className="flex items-center gap-2 p-6 text-[13px] text-slate-500"><Receipt className="h-4 w-4" /> No bills yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3 text-left font-semibold">Bill no.</th>
                    <th className="py-2 pr-3 text-left font-semibold">Customer</th>
                    <th className="py-2 pr-3 text-left font-semibold">From → To</th>
                    <th className="py-2 pr-3 text-left font-semibold">Date</th>
                    <th className="py-2 pr-3 text-right font-semibold">Gross</th>
                    <th className="py-2 pr-3 text-right font-semibold">Balance</th>
                    <th className="py-2 pr-3 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((b) => (
                    <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2.5 pr-3">
                        <Link href={`/admin/invoices/${b.id}`} className="font-mono font-medium text-slate-900 hover:underline">{b.invoice_number}</Link>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-700">{b.customer_name}</td>
                      <td className="py-2.5 pr-3 text-slate-500">{(b.route_from ?? "—") + " → " + (b.route_to ?? "—")}</td>
                      <td className="py-2.5 pr-3 text-slate-500">{deDate(b.issue_date)}</td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-slate-900">{formatMoney(num(b.gross_amount).toFixed(2), cur)}</td>
                      <td className={cn("py-2.5 pr-3 text-right font-mono tabular-nums", b.is_overdue ? "text-rose-600" : num(b.balance_due) > 0 ? "text-amber-700" : "text-emerald-700")}>
                        {formatMoney(num(b.balance_due).toFixed(2), cur)}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-600 capitalize">{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>

        {data && data.pagination.total > PAGE_SIZE && (
          <Pagination page={page} totalPages={data.pagination.pages} totalItems={data.pagination.total} onPageChange={setPage} />
        )}
      </div>
    </>
  );
}
