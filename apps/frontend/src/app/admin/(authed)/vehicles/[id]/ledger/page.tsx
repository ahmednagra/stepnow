// apps/frontend/src/app/admin/(authed)/vehicles/[id]/ledger/page.tsx
// Per-vehicle account — the vehicle's orders with their ORDER prices and totals (drivers are paid
// on a percentage of this). Editing a bill never changes these figures. Excel/CSV + PDF export.

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileDown } from "lucide-react";
import { AdminPageHeader, AdminCard } from "@/components/admin";
import { useDefaultCurrency, useVehicleLedger } from "@/hooks/queries";
import { downloadVehicleLedgerPdf } from "@/services/vehicles/vehicles.admin.client";
import { useAdminToast } from "@/hooks/useAdminToast";
import { formatMoney } from "@/utils/decimal";
import { exportCsv } from "@/utils/exporters";

const num = (s: string | null | undefined) => Number(s ?? "0") || 0;
const deDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "2-digit" }) : "—";

export default function VehicleLedgerPage({ params }: { params: { id: string } }) {
  const cur = useDefaultCurrency();
  const pushToast = useAdminToast((s) => s.push);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const dates = { date_from: from || undefined, date_to: to || undefined };
  const { data, isLoading, isError } = useVehicleLedger(params.id, dates);
  const orders = data?.orders ?? [];

  const exportRows = useMemo(
    () => orders.map((o) => ({
      order_no: o.order_number, date: o.date ?? "", customer: o.customer_name,
      from: o.route_from ?? "", to: o.route_to ?? "",
      net: num(o.net_amount).toFixed(2), gross: num(o.gross_amount).toFixed(2),
      paid: num(o.amount_paid).toFixed(2), balance: num(o.balance_due).toFixed(2), status: o.status,
    })),
    [orders],
  );

  return (
    <>
      <AdminPageHeader
        title={data ? `Account — ${data.vehicle_label}` : "Vehicle account"}
        description="Order list & prices for this vehicle (driver percentage base). Bill edits don't affect these."
        actions={
          <>
            <button type="button" disabled={!orders.length}
              onClick={() => exportCsv(exportRows, `vehicle-${data?.vehicle_label ?? params.id}.csv`)}
              className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} /> Excel/CSV
            </button>
            <button type="button" disabled={!orders.length}
              onClick={() => downloadVehicleLedgerPdf(params.id, data?.vehicle_label, dates).catch(() => pushToast("error", "PDF download failed"))}
              className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40">
              <FileDown className="h-3.5 w-3.5" strokeWidth={1.5} /> PDF
            </button>
            <Link href="/admin/vehicles" className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> Vehicles
            </Link>
          </>
        }
      />

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[12px] text-slate-600">From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ml-1 h-8 border border-slate-300 bg-white px-2 text-[12.5px]" /></label>
          <label className="text-[12px] text-slate-600">To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ml-1 h-8 border border-slate-300 bg-white px-2 text-[12.5px]" /></label>
          {(from || to) && <button type="button" onClick={() => { setFrom(""); setTo(""); }} className="h-8 px-2 text-[12px] text-slate-500 hover:text-slate-900">Clear</button>}
        </div>

        {data && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[["Orders", String(data.totals.count)], ["Net", formatMoney(num(data.totals.net).toFixed(2), cur)], ["Gross", formatMoney(num(data.totals.gross).toFixed(2), cur)], ["Outstanding", formatMoney(num(data.totals.balance).toFixed(2), cur)]].map(([k, v]) => (
              <div key={k} className="border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-slate-500">{k}</p>
                <p className="mt-0.5 font-mono text-[14px] font-semibold tabular-nums text-slate-900">{v}</p>
              </div>
            ))}
          </div>
        )}

        <AdminCard>
          {isLoading ? (
            <p className="p-6 text-[13px] text-slate-500">Loading account…</p>
          ) : isError ? (
            <p className="p-6 text-[13px] text-rose-600">Could not load the account.</p>
          ) : orders.length === 0 ? (
            <p className="p-6 text-[13px] text-slate-500">No orders for this vehicle in the selected period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3 text-left font-semibold">Order</th>
                    <th className="py-2 pr-3 text-left font-semibold">Date</th>
                    <th className="py-2 pr-3 text-left font-semibold">Customer</th>
                    <th className="py-2 pr-3 text-left font-semibold">From → To</th>
                    <th className="py-2 pr-3 text-right font-semibold">Net</th>
                    <th className="py-2 pr-3 text-right font-semibold">Gross</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.order_id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2.5 pr-3"><Link href={`/admin/orders/${o.order_id}`} className="font-mono text-slate-900 hover:underline">A-{o.order_number}</Link></td>
                      <td className="py-2.5 pr-3 text-slate-500">{deDate(o.date)}</td>
                      <td className="py-2.5 pr-3 text-slate-700">{o.customer_name}</td>
                      <td className="py-2.5 pr-3 text-slate-500">{(o.route_from ?? "—") + " → " + (o.route_to ?? "—")}</td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-slate-700">{formatMoney(num(o.net_amount).toFixed(2), cur)}</td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums text-slate-900">{formatMoney(num(o.gross_amount).toFixed(2), cur)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminCard>
      </div>
    </>
  );
}
