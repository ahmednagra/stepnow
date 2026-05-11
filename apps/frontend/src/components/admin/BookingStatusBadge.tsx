// src/components/admin/BookingStatusBadge.tsx
import type { BookingStatus } from "@/types";
import { cn } from "@/utils/cn";

const STATUS_LABELS: Record<BookingStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_TONES: Record<BookingStatus, string> = {
  new: "bg-amber-50 text-amber-700 border-amber-200",
  contacted: "bg-blue-50 text-blue-700 border-blue-200",
  quoted: "bg-violet-50 text-violet-700 border-violet-200",
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-slate-100 text-slate-700 border-slate-300",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

interface BookingStatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        STATUS_TONES[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export { STATUS_LABELS as BOOKING_STATUS_LABELS, STATUS_TONES as BOOKING_STATUS_TONES };
