// apps/frontend/src/components/admin/OrderStatusBadge.tsx
// Status badge for orders — same wrap+dot pattern and palette restraint as BookingStatusBadge.
import { cn } from "@/utils/cn";

export type OrderStatus = "open" | "completed" | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  open: "Open",
  completed: "Completed",
  cancelled: "Cancelled",
};

interface Tone {
  wrap: string;
  dot: string;
}

export const ORDER_STATUS_TONES: Record<OrderStatus, Tone> = {
  open:      { wrap: "bg-amber-50 text-amber-800 border-amber-200",       dot: "bg-amber-500" },
  completed: { wrap: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  cancelled: { wrap: "bg-rose-50 text-rose-800 border-rose-200",          dot: "bg-rose-500" },
};

const FALLBACK_TONE: Tone = { wrap: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" };

interface OrderStatusBadgeProps {
  status: OrderStatus | string | null | undefined;
  className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const key = typeof status === "string" && status.length > 0 ? status : null;
  const tone = (key !== null && (ORDER_STATUS_TONES as Record<string, Tone>)[key]) || FALLBACK_TONE;
  const label = (key !== null && (ORDER_STATUS_LABELS as Record<string, string>)[key]) || (key ?? "—");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]",
        tone.wrap,
        className,
      )}
    >
      <span aria-hidden="true" className={cn("inline-block h-1.5 w-1.5 rounded-full", tone.dot)} />
      {label}
    </span>
  );
}
