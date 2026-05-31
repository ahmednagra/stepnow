// apps/frontend/src/app/admin/(authed)/bookings/[id]/_convert-to-order.tsx
// Additive island for the booking detail page (Naeem: "booking auto convert to order").
// Renders nothing destructive — just a card that converts this booking into an order.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRightCircle } from "lucide-react";
import { AdminCard, AdminFormField, adminInputClass } from "@/components/admin";
import { convertBookingToOrder } from "@/services/orders";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { normalizeDecimalInput } from "@/utils/decimal";

interface Props {
  bookingId: string;
  /** Prefill from the booking's quoted price if present. */
  suggestedNet?: string | null;
}

export function ConvertToOrderCard({ bookingId, suggestedNet }: Props) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const [net, setNet] = useState(suggestedNet ?? "");
  const [vatRate, setVatRate] = useState("0.07"); // 7% reduced (PBefG); switch to 0.19 for courier/special
  const [dueDays, setDueDays] = useState("14");
  const [busy, setBusy] = useState(false);

  async function convert() {
    const normalized = normalizeDecimalInput(net);
    if (!normalized) { pushToast("error", "Enter a valid net amount (e.g. 45.00)"); return; }
    setBusy(true);
    try {
      const order = await convertBookingToOrder(bookingId, {
        net_amount: normalized,
        vat_rate: vatRate,
        payment_due_days: Number(dueDays) || 14,
      });
      pushToast("success", `Order ${order.order_number} created`);
      router.push(`/admin/orders/${order.id}`);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Network error";
      pushToast("error", "Could not convert", msg);
    } finally { setBusy(false); }
  }

  return (
    <AdminCard title="Convert to order" description="Create a confirmed job + optional billing from this booking.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <AdminFormField label="Net amount (€)">
          <input className={adminInputClass} inputMode="decimal" placeholder="0.00" value={net} onChange={(e) => setNet(e.target.value)} />
        </AdminFormField>
        <AdminFormField label="VAT rate">
          <select className={adminInputClass} value={vatRate} onChange={(e) => setVatRate(e.target.value)}>
            <option value="0.07">7% (Personenbeförderung)</option>
            <option value="0.19">19% (Kurier/Sonder)</option>
            <option value="0">0%</option>
          </select>
        </AdminFormField>
        <AdminFormField label="Payment term (days)">
          <input className={adminInputClass} type="number" min={0} value={dueDays} onChange={(e) => setDueDays(e.target.value)} />
        </AdminFormField>
      </div>
      <button
        type="button" onClick={convert} disabled={busy}
        className="mt-4 flex h-9 items-center gap-1.5 bg-slate-900 px-3 text-[12.5px] font-medium text-white disabled:opacity-40"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRightCircle className="h-3.5 w-3.5" />} Convert to order
      </button>
    </AdminCard>
  );
}
