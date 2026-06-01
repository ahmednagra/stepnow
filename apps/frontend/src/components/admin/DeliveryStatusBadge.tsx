// src/components/admin/DeliveryStatusBadge.tsx
// Delivery lifecycle badge (separate from the financial OrderStatusBadge).

import type { DeliveryStatus } from "@/services/courier";

const MAP: Record<DeliveryStatus, { label: string; cls: string }> = {
  draft:      { label: "Draft",      cls: "bg-slate-100 text-slate-600 ring-slate-200" },
  dispatched: { label: "Dispatched", cls: "bg-sky-100 text-sky-700 ring-sky-200" },
  picked_up:  { label: "Picked up",  cls: "bg-amber-100 text-amber-700 ring-amber-200" },
  delivered:  { label: "Delivered",  cls: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
};

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const v = MAP[status] ?? MAP.draft;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${v.cls}`}>
      {v.label}
    </span>
  );
}
