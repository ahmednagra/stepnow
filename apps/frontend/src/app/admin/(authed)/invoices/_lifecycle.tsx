// apps/frontend/src/app/admin/(authed)/invoices/_lifecycle.tsx
// Shared invoice lifecycle controls for the bill editor and the order detail: status badge,
// Issue (draft → frozen Beleg), Storno (issued/paid → cancelled, typed confirmation) and
// "Replacement" after a Storno. All rules are enforced server-side; the UI only offers what is legal.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, FileDown, FilePlus2, Loader2, Stamp } from "lucide-react";
import { ConfirmDialog, adminTextareaClass } from "@/components/admin";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { useCancelInvoice, useCreateOrderInvoice, useIssueInvoice } from "@/hooks/mutations";
import { useAdminToast } from "@/hooks/useAdminToast";
import { ApiError } from "@/lib/api-errors";
import { downloadStornoPdfById, type InvoiceAdmin, type InvoiceStatus } from "@/services/orders";

const STATUS: Record<InvoiceStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "neutral" },
  issued: { label: "Issued", tone: "gold" },
  paid: { label: "Paid", tone: "success" },
  cancelled: { label: "Cancelled (Storno)", tone: "danger" },
};

const btn = "flex h-9 items-center gap-1.5 px-3 text-[12.5px] font-medium disabled:opacity-40";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>;
}

export function InvoiceLifecycleActions({ invoice }: { invoice: InvoiceAdmin }) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const issue = useIssueInvoice();
  const cancel = useCancelInvoice();
  const replace = useCreateOrderInvoice(invoice.order_id);
  const [dialog, setDialog] = useState<"issue" | "cancel" | null>(null);
  const [reason, setReason] = useState("");
  const fail = (title: string, e: unknown) => pushToast("error", title, e instanceof ApiError ? e.message : "Network error");

  async function onIssue() {
    try {
      await issue.mutateAsync(invoice.id);
      pushToast("success", `Invoice ${invoice.invoice_number} issued`);
      setDialog(null);
    } catch (e) { fail("Could not issue the invoice", e); }
  }
  async function onCancel() {
    try {
      await cancel.mutateAsync({ invoiceId: invoice.id, reason: reason.trim() || undefined });
      pushToast("success", `Invoice ${invoice.invoice_number} cancelled`, "Create the replacement to re-bill the job.");
      setDialog(null);
      setReason("");
    } catch (e) { fail("Could not cancel the invoice", e); }
  }
  async function onReplace() {
    try {
      const next = await replace.mutateAsync({});
      router.push(`/admin/invoices/${next.id}`);
    } catch (e) { fail("Could not create the replacement", e); }
  }

  return (
    <>
      {invoice.status === "draft" && (
        <button type="button" onClick={() => setDialog("issue")} disabled={issue.isPending} className={`${btn} bg-slate-900 text-white hover:bg-slate-800`}>
          <Stamp className="h-3.5 w-3.5" strokeWidth={1.5} /> Issue invoice
        </button>
      )}
      {(invoice.status === "issued" || invoice.status === "paid") && (
        <button type="button" onClick={() => setDialog("cancel")} disabled={cancel.isPending} className={`${btn} border border-rose-300 bg-white text-rose-700 hover:bg-rose-50`}>
          <Ban className="h-3.5 w-3.5" strokeWidth={1.5} /> Cancel (Storno)
        </button>
      )}
      {invoice.status === "cancelled" && (
        <button type="button" onClick={() => downloadStornoPdfById(invoice.id, invoice.invoice_number).catch(() => pushToast("error", "Storno PDF download failed"))}
          className={`${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>
          <FileDown className="h-3.5 w-3.5" strokeWidth={1.5} /> Stornorechnung
        </button>
      )}
      {invoice.status === "cancelled" && (
        <button type="button" onClick={onReplace} disabled={replace.isPending} className={`${btn} border border-slate-300 bg-white text-slate-700 hover:bg-slate-50`}>
          {replace.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FilePlus2 className="h-3.5 w-3.5" strokeWidth={1.5} />} Replacement invoice
        </button>
      )}

      <ConfirmDialog
        open={dialog === "issue"}
        title={`Issue invoice ${invoice.invoice_number}?`}
        description={<p>The invoice is dated today and its PDF is frozen as a Buchungsbeleg. It can no longer be edited — only cancelled (Storno) and replaced.</p>}
        confirmLabel="Issue invoice"
        isLoading={issue.isPending}
        onConfirm={onIssue}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog === "cancel"}
        tone="danger"
        title={`Cancel invoice ${invoice.invoice_number}?`}
        requireTypeToConfirm={invoice.invoice_number}
        description={
          <div className="space-y-3">
            <p>The number is retired for good and a Stornorechnung (negated amounts) is issued. Payments already booked on it stay on the order and move to the replacement invoice, which gets the next revision number.</p>
            <textarea className={adminTextareaClass} rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (internal, optional)" />
          </div>
        }
        confirmLabel="Cancel invoice"
        cancelLabel="Keep invoice"
        isLoading={cancel.isPending}
        onConfirm={onCancel}
        onCancel={() => setDialog(null)}
      />
    </>
  );
}
