// apps/frontend/src/components/admin/BookingStatusBadge.tsx
// Status badge for bookings. Tone palette matches admin restraint.
import { cn } from "@/utils/cn";
import { type BookingStatus } from "@/types/booking";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  new: "Neu",
  contacted: "Kontaktiert",
  quoted: "Angebot",
  confirmed: "Bestätigt",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
};

interface Tone {
  wrap: string;
  dot: string;
}

export const BOOKING_STATUS_TONES: Record<BookingStatus, Tone> = {
  new:       { wrap: "bg-amber-50 text-amber-800 border-amber-200",     dot: "bg-amber-500" },
  contacted: { wrap: "bg-sky-50 text-sky-800 border-sky-200",           dot: "bg-sky-500" },
  quoted:    { wrap: "bg-indigo-50 text-indigo-800 border-indigo-200",  dot: "bg-indigo-500" },
  confirmed: { wrap: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  completed: { wrap: "bg-slate-100 text-slate-700 border-slate-200",    dot: "bg-slate-400" },
  cancelled: { wrap: "bg-rose-50 text-rose-800 border-rose-200",        dot: "bg-rose-500" },
};

const FALLBACK_TONE: Tone = {
  wrap: "bg-slate-100 text-slate-700 border-slate-200",
  dot: "bg-slate-400",
};

export type { BookingStatus };

interface BookingStatusBadgeProps {
  status: BookingStatus | string | null | undefined;
  className?: string;
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  const key: string | null =
    typeof status === "string" && status.length > 0 ? status : null;

  const tone: Tone =
    (key !== null && (BOOKING_STATUS_TONES as Record<string, Tone>)[key]) || FALLBACK_TONE;

  const label: string =
    (key !== null && (BOOKING_STATUS_LABELS as Record<string, string>)[key]) ||
    (key ?? "—");

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