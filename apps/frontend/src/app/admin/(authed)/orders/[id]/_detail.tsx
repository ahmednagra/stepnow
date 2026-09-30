// apps/frontend/src/app/admin/(authed)/orders/[id]/_detail.tsx
// Client island for an order: snapshot, status control, billing (live invoice + Storno history)
// and the payments ledger. Data comes from the useOrder query (passed in); every write goes through
// a mutation hook that invalidates the billing root keys, so nothing here holds a stale copy.
// Balance/paid state is read from the server's derived fields (never computed here).

"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Save, FileText, Plus, Download, ExternalLink, Undo2 } from "lucide-react";
import { AdminCard, AdminFormField, ConfirmDialog, adminInputClass } from "@/components/admin";
import { OrderStatusBadge, type OrderStatus } from "@/components/admin/OrderStatusBadge";
import { Badge } from "@/components/ui/Badge";
import { useDefaultCurrency } from "@/hooks/queries";
import { useCreateOrderInvoice, useRecordOrderPayment, useSetPaymentStatus, useUpdateOrder } from "@/hooks/mutations";
import { downloadInvoicePdf, type OrderDetail, type PaymentAdmin, type PaymentMethod } from "@/services/orders";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { formatMoney, normalizeDecimalInput } from "@/utils/decimal";
import { InvoiceLifecycleActions, InvoiceStatusBadge } from "../../invoices/_lifecycle";

const ORDER_STATUSES: OrderStatus[] = ["open", "completed", "cancelled"];
const PAYMENT_METHODS: PaymentMethod[] = ["cash", "girocard", "bank_transfer", "paypal", "other"];

export function OrderDetailIsland({ order }: { order: OrderDetail }) {
  const cur = useDefaultCurrency();
  const pushToast = useAdminToast((s) => s.push);
  const updateOrder = useUpdateOrder(order.id);
  const createInvoice = useCreateOrderInvoice(order.id);
  const recordPayment = useRecordOrderPayment(order.id);
  const setPaymentStatus = useSetPaymentStatus();
  const fail = (title: string, e: unknown) => pushToast("error", title, e instanceof ApiError ? e.message : "Network error");
  const readOnly = order.is_deleted;
  const inv = order.invoice;
  const history = order.invoices.filter((i) => i.id !== inv?.id);

  // ── status ──
  const [status, setStatus] = useState<OrderStatus>(order.status);
  async function saveStatus() {
    try {
      await updateOrder.mutateAsync({ status });
      pushToast("success", "Order updated");
    } catch (e) { fail("Save failed", e); }
  }

  // ── invoice ──
  async function onCreateInvoice() {
    try {
      await createInvoice.mutateAsync({});
      pushToast("success", history.length ? "Replacement invoice created" : "Invoice created");
    } catch (e) { fail("Could not create invoice", e); }
  }

  // ── payments ──
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");
  const [refunding, setRefunding] = useState<PaymentAdmin | null>(null);
  async function addPayment() {
    const normalized = normalizeDecimalInput(amount);
    if (!normalized) { pushToast("error", "Enter a valid amount (e.g. 45.50)"); return; }
    try {
      // No invoice_id: the server books it on the live invoice (or the order when unbilled).
      await recordPayment.mutateAsync({ amount: normalized, method, reference: reference.trim() || undefined });
      setAmount(""); setReference("");
      pushToast("success", "Payment recorded");
    } catch (e) { fail("Could not record payment", e); }
  }
  async function refund() {
    if (!refunding) return;
    try {
      await setPaymentStatus.mutateAsync({ paymentId: refunding.id, status: "refunded" });
      pushToast("success", "Payment refunded");
      setRefunding(null);
    } catch (e) { fail("Could not refund the payment", e); }
  }

  const balancePositive = Number(order.balance_due) > 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* ── Left: snapshot + status ── */}
      <div className="space-y-4 lg:col-span-2">
        {readOnly && (
          <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-[12.5px] text-rose-800">This order was deleted. It is shown read-only for the record.</p>
        )}
        <AdminCard title="Order" headerActions={<OrderStatusBadge status={order.status} />}>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
            <Field label="Order-No." value={order.order_number} mono />
            <Field label="Scheduled" value={order.scheduled_datetime ? new Date(order.scheduled_datetime).toLocaleString("en-GB") : "—"} />
            <Field label="Pickup" value={order.pickup_address} />
            <Field label="Destination" value={order.destination_address} />
            <Field label="Customer" value={order.customer_name} />
            <Field label="Phone" value={order.customer_phone} />
            <Field label="Email" value={order.customer_email} />
          </dl>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 text-[13px]">
            <Field label="Net" value={formatMoney(order.net_amount, cur)} />
            <Field label={`VAT (${(Number(order.vat_rate) * 100).toFixed(0)}%)`} value={formatMoney(order.vat_amount, cur)} />
            <Field label="Gross" value={formatMoney(order.gross_amount, cur)} strong />
          </div>
        </AdminCard>

        {!readOnly && (
          <AdminCard title="Status">
            <div className="flex items-end gap-3">
              <AdminFormField label="Order status">
                <select className={adminInputClass} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </AdminFormField>
              <button
                type="button" onClick={saveStatus} disabled={updateOrder.isPending || status === order.status}
                className="flex h-9 items-center gap-1.5 bg-slate-900 px-3 text-[12.5px] font-medium text-white disabled:opacity-40"
              >
                {updateOrder.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
              </button>
            </div>
          </AdminCard>
        )}
      </div>

      {/* ── Right: billing + payments ── */}
      <div className="space-y-4">
        <AdminCard title="Invoice" headerActions={inv ? <InvoiceStatusBadge status={inv.status} /> : undefined}>
          {inv ? (
            <div className="space-y-3">
              <dl className="space-y-2 text-[13px]">
                <Field label="Invoice-No." value={inv.invoice_number} mono />
                <Field label={inv.status === "draft" ? "Date (set on issue)" : "Issued"} value={inv.issue_date} />
                <Field label="Gross" value={formatMoney(inv.gross_amount, cur)} strong />
              </dl>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/invoices/${inv.id}`}
                  className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} /> {inv.status === "draft" ? "Edit bill" : "Open bill"}
                </Link>
                <button
                  type="button"
                  onClick={() => downloadInvoicePdf(order.id, inv.invoice_number).catch(() => pushToast("error", "PDF download failed"))}
                  className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" strokeWidth={1.5} /> PDF
                </button>
                {!readOnly && <InvoiceLifecycleActions invoice={inv} />}
              </div>
            </div>
          ) : !readOnly && (
            <button
              type="button" onClick={onCreateInvoice} disabled={createInvoice.isPending || order.status === "cancelled"}
              className="flex h-9 w-full items-center justify-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <FileText className="h-3.5 w-3.5" strokeWidth={1.5} /> {history.length ? "Create replacement invoice" : "Create invoice"}
            </button>
          )}
          {history.length > 0 && (
            <ul className="mt-3 divide-y divide-slate-100 border-t border-slate-100 text-[12px]">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between py-2">
                  <Link href={`/admin/invoices/${h.id}`} className="font-mono text-slate-600 hover:underline">{h.invoice_number}</Link>
                  <InvoiceStatusBadge status={h.status} />
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <AdminCard
          title="Payments"
          headerActions={
            <Badge tone={balancePositive ? "warn" : "success"}>
              {balancePositive ? `Due ${formatMoney(order.balance_due, cur)}` : "Paid"}
            </Badge>
          }
        >
          <div className="mb-3 flex justify-between text-[12px] text-slate-500">
            <span>Paid {formatMoney(order.amount_paid, cur)}</span>
            <span>Balance {formatMoney(order.balance_due, cur)}</span>
          </div>

          {order.payments.length > 0 && (
            <ul className="mb-3 divide-y divide-slate-100 border-y border-slate-100">
              {order.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-[12.5px]">
                  <span className="text-slate-700">
                    {p.method} · {new Date(p.received_at).toLocaleDateString("en-GB")}
                    {p.status !== "received" && <span className="ml-1.5 text-[11px] uppercase tracking-wide text-slate-400">{p.status}</span>}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={p.status === "received" ? "font-medium tabular-nums text-slate-900" : "tabular-nums text-slate-400 line-through"}>{formatMoney(p.amount, cur)}</span>
                    {!readOnly && p.status === "received" && (
                      <button type="button" onClick={() => setRefunding(p)} title="Refund" className="text-slate-400 hover:text-rose-700">
                        <Undo2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {!readOnly && (
            <div className="space-y-2">
              <input className={adminInputClass} inputMode="decimal" placeholder="Amount (e.g. 45.50)" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <div className="flex gap-2">
                <select className={adminInputClass} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <input className={adminInputClass} placeholder="Ref. (optional)" value={reference} onChange={(e) => setReference(e.target.value)} />
              </div>
              <button
                type="button" onClick={addPayment} disabled={recordPayment.isPending}
                className="flex h-9 w-full items-center justify-center gap-1.5 bg-slate-900 px-3 text-[12.5px] font-medium text-white disabled:opacity-40"
              >
                {recordPayment.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Record payment
              </button>
            </div>
          )}
        </AdminCard>
      </div>

      <ConfirmDialog
        open={refunding !== null}
        tone="danger"
        title="Refund this payment?"
        description={<p>{refunding ? `${formatMoney(refunding.amount, cur)} (${refunding.method})` : ""} is marked refunded. The row stays in the ledger; the invoice and order return to open if the balance is no longer covered.</p>}
        confirmLabel="Refund payment"
        isLoading={setPaymentStatus.isPending}
        onConfirm={refund}
        onCancel={() => setRefunding(null)}
      />
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
