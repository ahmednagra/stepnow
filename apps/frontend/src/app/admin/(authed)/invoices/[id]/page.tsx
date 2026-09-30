// apps/frontend/src/app/admin/(authed)/invoices/[id]/page.tsx
// Bill editor — while the bill is a DRAFT every detail is editable in place (recipient, base net,
// VAT, Skonto, and ad-hoc charge/discount line items like Wartezeit). Totals recompute live; Save
// PATCHes the bill. Issuing freezes it (GoBD Buchungsbeleg): the form turns read-only and the only
// correction is a Storno + replacement. Editing here only varies the company account — the vehicle
// account (order amounts) is untouched. Built on the admin design system.

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, Save, FileDown, Loader2 } from "lucide-react";
import { AdminPageHeader, AdminCard, AdminFormField, adminInputClass } from "@/components/admin";
import { useDefaultCurrency, useInvoice } from "@/hooks/queries";
import { useUpdateInvoice } from "@/hooks/mutations";
import { InvoiceLifecycleActions, InvoiceStatusBadge } from "../_lifecycle";
import { downloadInvoicePdfById, type InvoiceItemInput, type InvoiceItemKind } from "@/services/orders";
import { useAdminToast } from "@/hooks/useAdminToast";
import { ApiError } from "@/lib/api-errors";
import { normalizeDecimalInput, formatMoney } from "@/utils/decimal";
import { cn } from "@/utils/cn";

const num = (s: string | null | undefined) => Number(normalizeDecimalInput(s ?? "") || "0") || 0;

type Row = { kind: InvoiceItemKind; label: string; net_amount: string };

export default function InvoiceEditorPage({ params }: { params: { id: string } }) {
  const cur = useDefaultCurrency();
  const eur = (n: number) => formatMoney((Number.isFinite(n) ? n : 0).toFixed(2), cur);
  const pushToast = useAdminToast((s) => s.push);
  const { data: inv, isLoading, isError } = useInvoice(params.id);
  const save = useUpdateInvoice(params.id);

  const [recipient, setRecipient] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDays, setDueDays] = useState("14");
  const [baseNet, setBaseNet] = useState("0");
  const [vatPct, setVatPct] = useState("19");
  const [skontoPct, setSkontoPct] = useState("");
  const [skontoDays, setSkontoDays] = useState("");
  const [items, setItems] = useState<Row[]>([]);

  // Seed local editor state once the bill loads.
  useEffect(() => {
    if (!inv) return;
    setRecipient(inv.recipient_block ?? "");
    setTaxNumber(inv.tax_number ?? "");
    setIssueDate(inv.issue_date);
    setDueDays(String(inv.payment_due_days));
    setBaseNet(inv.base_net);
    setVatPct(String(+(Number(inv.vat_rate) * 100).toFixed(2)));
    setSkontoPct(inv.skonto_pct ?? "");
    setSkontoDays(inv.skonto_days != null ? String(inv.skonto_days) : "");
    setItems(inv.items.map((it) => ({ kind: it.kind, label: it.label, net_amount: it.net_amount })));
  }, [inv]);

  const rate = (Number(vatPct) || 0) / 100;
  const adjust = useMemo(
    () => items.reduce((sum, it) => sum + (it.kind === "charge" ? num(it.net_amount) : -num(it.net_amount)), 0),
    [items],
  );
  const netTotal = num(baseNet) + adjust;
  const vatAmt = netTotal * rate;
  const gross = netTotal + vatAmt;
  const skontoAmt = (Number(skontoPct) || 0) > 0 ? gross * (Number(skontoPct) / 100) : 0;

  function setItem(i: number, patch: Partial<Row>) {
    setItems((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function onSave() {
    try {
      await save.mutateAsync({
        recipient_block: recipient.trim() || null,
        tax_number: taxNumber.trim() || null,
        issue_date: issueDate,
        payment_due_days: Number(dueDays) || 0,
        base_net: normalizeDecimalInput(baseNet) || "0",
        vat_rate: String(rate),
        skonto_pct: skontoPct ? normalizeDecimalInput(skontoPct) : null,
        skonto_days: skontoDays ? Number(skontoDays) : null,
        items: items
          .filter((r) => r.label.trim() && num(r.net_amount) > 0)
          .map((r, idx): InvoiceItemInput => ({
            kind: r.kind, label: r.label.trim(), net_amount: normalizeDecimalInput(r.net_amount) || "0", sort_order: idx,
          })),
      });
      pushToast("success", "Bill updated");
    } catch (e) {
      pushToast("error", "Could not save the bill", e instanceof ApiError ? e.message : "Network error");
    }
  }

  if (isLoading) return <div className="p-6 text-[13px] text-slate-500">Loading bill…</div>;
  if (isError || !inv) return <div className="p-6 text-[13px] text-rose-600">Could not load the bill.</div>;
  const editable = inv.status === "draft";

  return (
    <>
      <AdminPageHeader
        title={`Bill ${inv.invoice_number}`}
        description={editable
          ? "Draft — edit every detail, then issue it. Vehicle accounts are unaffected."
          : "Issued bills are frozen Buchungsbelege. Correct one with a Storno and a replacement invoice."}
        center={<InvoiceStatusBadge status={inv.status} />}
        actions={
          <>
            <InvoiceLifecycleActions invoice={inv} />
            <button type="button" onClick={() => downloadInvoicePdfById(inv.id, inv.invoice_number).catch(() => pushToast("error", "PDF download failed"))}
              className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">
              <FileDown className="h-3.5 w-3.5" strokeWidth={1.5} /> Download PDF
            </button>
            <Link href={`/admin/orders/${inv.order_id}`} className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> Order
            </Link>
          </>
        }
      />

      <fieldset disabled={!editable} className="grid min-w-0 grid-cols-1 gap-4 p-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <AdminCard title="Recipient & terms">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <AdminFormField label="Recipient (Rechnung an)">
                  <textarea className={cn(adminInputClass, "h-auto py-2")} rows={3} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Firma\nz.Hd.\nStraße\nPLZ Ort" />
                </AdminFormField>
              </div>
              <AdminFormField label="Steuer-Nr."><input className={adminInputClass} value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} /></AdminFormField>
              <AdminFormField label="Issue date"><input type="date" className={adminInputClass} value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></AdminFormField>
              <AdminFormField label="Payment term (days)"><input type="number" min={0} className={adminInputClass} value={dueDays} onChange={(e) => setDueDays(e.target.value)} /></AdminFormField>
              <AdminFormField label="VAT %"><input type="number" min={0} max={100} step={0.1} className={adminInputClass} value={vatPct} onChange={(e) => setVatPct(e.target.value)} /></AdminFormField>
              <AdminFormField label="Skonto %"><input type="number" min={0} max={100} step={0.5} className={adminInputClass} value={skontoPct} onChange={(e) => setSkontoPct(e.target.value)} placeholder="e.g. 5" /></AdminFormField>
              <AdminFormField label="Skonto within (days)"><input type="number" min={0} className={adminInputClass} value={skontoDays} onChange={(e) => setSkontoDays(e.target.value)} placeholder="e.g. 7" /></AdminFormField>
            </div>
          </AdminCard>

          <AdminCard title="Line items" description="Base service price + ad-hoc charges (e.g. Wartezeit) and discounts. Edit in place.">
            <div className="space-y-2">
              <div className="flex items-center justify-between border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-[12.5px] font-medium text-slate-700">Base service (Grundpreis)</span>
                <div className="flex items-center gap-1.5">
                  <input type="number" min={0} step="0.01" className={cn(adminInputClass, "w-32 text-right")} value={baseNet} onChange={(e) => setBaseNet(e.target.value)} />
                  <span className="text-[11px] text-slate-500">{cur} netto</span>
                </div>
              </div>

              {items.map((r, i) => (
                <div key={i} className="grid grid-cols-[110px_1fr_120px_auto] items-center gap-2">
                  <select className={adminInputClass} value={r.kind} onChange={(e) => setItem(i, { kind: e.target.value as InvoiceItemKind })}>
                    <option value="charge">Charge</option>
                    <option value="discount">Discount</option>
                  </select>
                  <input className={adminInputClass} value={r.label} onChange={(e) => setItem(i, { label: e.target.value })} placeholder="e.g. Wartezeit" />
                  <input type="number" min={0} step="0.01" className={cn(adminInputClass, "text-right")} value={r.net_amount} onChange={(e) => setItem(i, { net_amount: e.target.value })} placeholder="0.00" />
                  <button type="button" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))} title="Remove line"
                    className="inline-flex h-9 w-9 items-center justify-center border border-slate-300 bg-white text-slate-500 hover:bg-slate-50">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              <button type="button" onClick={() => setItems((prev) => [...prev, { kind: "charge", label: "", net_amount: "" }])}
                className="inline-flex items-center gap-1.5 border border-dashed border-slate-300 px-3 py-1.5 text-[12px] font-semibold text-slate-600 hover:border-slate-400 hover:bg-slate-50">
                <Plus className="h-3.5 w-3.5" /> Add charge / discount
              </button>
            </div>
          </AdminCard>
        </div>

        {/* Live totals + save */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <AdminCard title="Totals">
            <dl className="space-y-1.5 text-[13px]">
              <div className="flex justify-between"><dt className="text-slate-500">Summe Netto</dt><dd className="font-mono">{eur(netTotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">zzgl. USt. {(+(rate * 100).toFixed(2))}%</dt><dd className="font-mono">{eur(vatAmt)}</dd></div>
              <div className="mt-1 flex justify-between border-t-2 border-slate-900 pt-2 text-[15px] font-semibold text-slate-900"><dt>Gesamtbetrag</dt><dd className="font-mono">{eur(gross)}</dd></div>
              {skontoAmt > 0 && skontoDays && (
                <p className="pt-2 text-[11px] text-slate-500">Skonto {skontoPct}% bei Zahlung binnen {skontoDays} Tagen = {eur(skontoAmt)}.</p>
              )}
            </dl>
            {editable && (
              <button type="button" onClick={onSave} disabled={save.isPending}
                className="mt-4 flex h-9 w-full items-center justify-center gap-1.5 bg-slate-900 px-3 text-[12.5px] font-medium text-white hover:bg-slate-800 disabled:opacity-40">
                {save.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save bill
              </button>
            )}
          </AdminCard>
        </div>
      </fieldset>
    </>
  );
}
