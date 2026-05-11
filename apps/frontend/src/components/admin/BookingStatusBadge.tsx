// apps/frontend/src/components/admin/BookingStatusBadge.tsx
// Phase 3d polish — refined tone palette matching admin restraint.

import { cn } from "@/utils/cn";

export const BOOKING_STATUS_LABELS = {
  new: "Neu",
  confirmed: "Bestätigt",
  in_progress: "Unterwegs",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
} as const;

export type BookingStatus = keyof typeof BOOKING_STATUS_LABELS;

export const BOOKING_STATUS_TONES: Record<
  BookingStatus,
  { wrap: string; dot: string }
> = {
  new: { wrap: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  confirmed: {
    wrap: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  in_progress: { wrap: "bg-sky-50 text-sky-800 border-sky-200", dot: "bg-sky-500" },
  completed: { wrap: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  cancelled: { wrap: "bg-rose-50 text-rose-800 border-rose-200", dot: "bg-rose-500" },
};

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const tone = BOOKING_STATUS_TONES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]",
        tone.wrap,
        className,
      )}
    >
      <span aria-hidden="true" className={cn("inline-block h-1.5 w-1.5 rounded-full", tone.dot)} />
      {BOOKING_STATUS_LABELS[status]}
    </span>
  );
}
