// apps/frontend/src/app/admin/(authed)/orders/[id]/_detail.tsx
// Client island for an order: snapshot, status control, optional invoice, payments ledger.
// Balance is read from the server's derived amount_paid / balance_due (never computed here).

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, FileText, Plus, Download } from "lucide-react";
import { AdminCard, AdminFormField, adminInputClass } from "@/components/admin";
import { OrderStatusBadge, type OrderStatus } from "@/components/admin/OrderStatusBadge";
import { Badge } from "@/components/ui/Badge";
import {
  getAdminOrder, updateAdminOrder, createOrderInvoice, recordOrderPayment, downloadInvoicePdf,
  type OrderDetail, type PaymentMethod,
} from "@/services/orders";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { formatPriceEur, normalizeDecimalInput } from "@/utils/decimal";

const ORDER_STATUSES: OrderStatus[] = ["open", "completed", "cancelled"];
const PAYMENT_METHODS: PaymentMethod[] = ["cash", "girocard", "bank_transfer", "paypal", "other"];

export function OrderDetailIsland({ initial }: { initial: OrderDetail }) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const [order, setOrder] = useState<OrderDetail>(initial);
  const [busy, setBusy] = useState(false);

  const refresh = async () => setOrder(await getAdminOrder(order.id));

  // ── status ──
  const [status, setStatus] = useState<OrderStatus>(initial.status);
  async function saveStatus() {
    setBusy(true);
    try {
      const updated = await updateAdminOrder(order.id, { status });
      setOrder(updated);
      pushToast("success", "Order updated");
      router.refresh();
    } catch (err) {
      pushToast("error", "Save failed", err instanceof ApiError ? err.message : "Network error");
    } finally { setBusy(false); }
  }

  // ── invoice ──
  async function createInvoice() {
    setBusy(true);
    try {
      await createOrderInvoice(order.id, {});
      await refresh();
      pushToast("success", "Invoice created");
    } catch (err) {
      pushToast("error", "Could not create invoice", err instanceof ApiError ? err.message : "Network error");
    } finally { setBusy(false); }
  }

  // ── payment ──
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  async function addPayment() {
    const normalized = normalizeDecimalInput(amount);
    if (!normalized) { pushToast("error", "Enter a valid amount (e.g. 45.50)"); return; }
    setBusy(true);
    try {
      await recordOrderPayment(order.id, {
        amount: normalized, method,
        invoice_id: order.invoice?.id, reference: reference.trim() || undefined,
      });
      await refresh();
      setAmount(""); setReference("");
      pushToast("success", "Payment recorded");
      router.refresh();
    } catch (err) {
      pushToast("error", "Could not record payment", err instanceof ApiError ? err.message : "Network error");
    } finally { setBusy(false); }
  }

  const balancePositive = Number(order.balance_due) > 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* ── Left: snapshot + status ── */}
      <div className="space-y-4 lg:col-span-2">
        <AdminCard title="Order" headerActions={<OrderStatusBadge status={order.status} />}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
            <Field label="Order-No." value={order.order_number} mono />
            <Field label="Scheduled" value={order.scheduled_datetime ? new Date(order.scheduled_datetime).toLocaleString("en-GB") : "—"} />
            <Field label="Pickup" value={order.pickup_address} />
            <Field label="Destination" value={order.destination_address} />
            <Field label="Customer" value={order.customer_name} />
            <Field label="Phone" value={order.customer_phone} />
          </dl>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-[13px]">
            <Field label="Net" value={formatPriceEur(order.net_amount)} />
            <Field label={`VAT (${(Number(order.vat_rate) * 100).toFixed(0)}%)`} value={formatPriceEur(order.vat_amount)} />
            <Field label="Gross" value={formatPriceEur(order.gross_amount)} strong />
          </div>
        </AdminCard>

        <AdminCard title="Status">
          <div className="flex items-end gap-3">
            <AdminFormField label="Order status">
              <select className={adminInputClass} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </AdminFormField>
            <button
              type="button" onClick={saveStatus} disabled={busy || status === order.status}
              className="flex h-9 items-center gap-1.5 bg-slate-900 px-3 text-[12.5px] font-medium text-white disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
            </button>
          </div>
        </AdminCard>
      </div>

      {/* ── Right: billing + payments ── */}
      <div className="space-y-4">
        <AdminCard
          title="Invoice"
          headerActions={order.invoice ? <Badge tone="gold">{order.invoice.status}</Badge> : undefined}
        >
          {order.invoice ? (
            <div className="space-y-3">
              <dl className="space-y-2 text-[13px]">
                <Field label="Invoice-No." value={order.invoice.invoice_number} mono />
                <Field label="Issued" value={order.invoice.issue_date} />
                <Field label="Gross" value={formatPriceEur(order.invoice.gross_amount)} strong />
              </dl>
              <button
                type="button"
                onClick={async () => {
                  try { await downloadInvoicePdf(order.id, order.invoice!.invoice_number); }
                  catch { pushToast("error", "PDF download failed"); }
                }}
                className="flex h-9 w-full items-center justify-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={1.5} /> Download PDF
              </button>
            </div>
          ) : (
            <button
              type="button" onClick={createInvoice} disabled={busy}
              className="flex h-9 w-full items-center justify-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <FileText className="h-3.5 w-3.5" strokeWidth={1.5} /> Create invoice
            </button>
          )}
        </AdminCard>

        <AdminCard
          title="Payments"
          headerActions={
            <Badge tone={balancePositive ? "warn" : "success"}>
              {balancePositive ? `Due ${formatPriceEur(order.balance_due)}` : "Paid"}
            </Badge>
          }
        >
          <div className="mb-3 flex justify-between text-[12px] text-slate-500">
            <span>Paid {formatPriceEur(order.amount_paid)}</span>
            <span>Balance {formatPriceEur(order.balance_due)}</span>
          </div>

          {order.payments.length > 0 && (
            <ul className="mb-3 divide-y divide-slate-100 border-y border-slate-100">
              {order.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 text-[12.5px]">
                  <span className="text-slate-700">{p.method} · {new Date(p.received_at).toLocaleDateString("en-GB")}</span>
                  <span className="font-medium tabular-nums text-slate-900">{formatPriceEur(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2">
            <input className={adminInputClass} inputMode="decimal" placeholder="Amount (e.g. 45.50)" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div className="flex gap-2">
              <select className={adminInputClass} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <input className={adminInputClass} placeholder="Ref. (optional)" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <button
              type="button" onClick={addPayment} disabled={busy}
              className="flex h-9 w-full items-center justify-center gap-1.5 bg-slate-900 px-3 text-[12.5px] font-medium text-white disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Record payment
            </button>
          </div>
        </AdminCard>
      </div>
    </div>
  );
}

function Field({ label, value, mono, strong }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div>
      <dt className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</dt>
      <dd className={[mono ? "font-mono" : "", strong ? "font-serif text-[15px] text-slate-900" : "text-slate-700", "mt-0.5"].join(" ")}>{value}</dd>
    </div>
  );
}
