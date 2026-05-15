// apps/frontend/src/app/admin/(authed)/bookings/[id]/_detail.tsx
// Booking detail with status changer, price quote, notes, print quote/invoice.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Save, Trash2, Mail, Phone, MapPin, Calendar, Users, Briefcase, Printer, FileText,
} from "lucide-react";
import {
  AdminCard, AdminFormField, ConfirmDialog,
  adminInputClass, adminTextareaClass,
} from "@/components/admin";
import {
  BOOKING_STATUSES, type BookingStatus, type BookingAdmin, type ServiceAdmin,
} from "@/types";
import { updateAdminBooking, deleteAdminBooking } from "@/services/bookings";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { normalizeDecimalInput } from "@/utils/decimal";
import { printNode } from "@/utils/exporters";
import { cn } from "@/utils/cn";

interface Props { initial: BookingAdmin; service: ServiceAdmin | null; }

const STATUS_LABELS: Record<BookingStatus, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_TONES: Record<BookingStatus, { wrap: string; dot: string }> = {
  new: { wrap: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
  contacted: { wrap: "bg-sky-50 text-sky-800 border-sky-200", dot: "bg-sky-500" },
  quoted: { wrap: "bg-indigo-50 text-indigo-800 border-indigo-200", dot: "bg-indigo-500" },
  confirmed: { wrap: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-500" },
  completed: { wrap: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  cancelled: { wrap: "bg-rose-50 text-rose-800 border-rose-200", dot: "bg-rose-500" },
};

function StatusPill({ status }: { status: BookingStatus }) {
  const tone = STATUS_TONES[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.16em]",
      tone.wrap,
    )}>
      <span aria-hidden="true" className={cn("inline-block h-1.5 w-1.5 rounded-full", tone.dot)} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function BookingDetail({ initial, service }: Props) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const [booking, setBooking] = useState<BookingAdmin>(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<BookingStatus>(initial.status);
  const [quotedPrice, setQuotedPrice] = useState(initial.quoted_price_eur ?? "");
  const [internalNotes, setInternalNotes] = useState(initial.internal_notes ?? "");
  const [priceError, setPriceError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isDirty =
    status !== booking.status ||
    quotedPrice !== (booking.quoted_price_eur ?? "") ||
    internalNotes !== (booking.internal_notes ?? "");

  async function onSave() {
    setPriceError(null);
    setBusy(true);
    let normalized: string | null = null;
    if (quotedPrice.trim()) {
      normalized = normalizeDecimalInput(quotedPrice);
      if (normalized === null) {
        setPriceError("Enter a valid amount (e.g. 45.50)");
        setBusy(false);
        return;
      }
    }
    try {
      const updated = await updateAdminBooking(booking.id, {
        status, quoted_price_eur: normalized, internal_notes: internalNotes.trim() || null,
      });
      setBooking(updated);
      setStatus(updated.status);
      setQuotedPrice(updated.quoted_price_eur ?? "");
      setInternalNotes(updated.internal_notes ?? "");
      pushToast("success", "Booking updated");
      router.refresh();
    } catch (err) {
      pushToast("error", "Save failed", err instanceof ApiError ? err.message : "Network error");
    } finally { setBusy(false); }
  }

  async function onDelete() {
    setBusy(true);
    try {
      await deleteAdminBooking(booking.id);
      pushToast("success", "Booking deleted");
      router.push("/admin/bookings");
      router.refresh();
    } catch (err) {
      pushToast("error", "Delete failed", err instanceof ApiError ? err.message : "Network error");
      setBusy(false);
    }
  }

  const when = new Date(booking.requested_datetime).toLocaleString("en-GB", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4" id="booking-printable">
        <AdminCard eyebrow={`Reference · ${booking.reference}`} title="Trip" serif>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-[13px]">
            <div className="col-span-2 flex items-start gap-2.5">
              <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A8865A]" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Pickup time</dt>
                <dd className="font-serif text-[18px] font-medium text-slate-900 tabular-nums">{when}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A8865A]" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">From</dt>
                <dd className="text-slate-900">{booking.pickup_address}</dd>
                {(booking.pickup_postcode || booking.pickup_city) && (
                  <dd className="text-[11.5px] text-slate-500">{booking.pickup_postcode} {booking.pickup_city}</dd>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-900" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">To</dt>
                <dd className="text-slate-900">{booking.destination_address}</dd>
                {(booking.destination_postcode || booking.destination_city) && (
                  <dd className="text-[11.5px] text-slate-500">{booking.destination_postcode} {booking.destination_city}</dd>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A8865A]" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Passengers</dt>
                <dd className="tabular-nums text-slate-900">{booking.passenger_count}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A8865A]" strokeWidth={1.5} aria-hidden="true" />
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Luggage</dt>
                <dd className="tabular-nums text-slate-900">{booking.luggage_count}</dd>
              </div>
            </div>
            {service && (
              <div className="col-span-2 border-t border-slate-100 pt-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Service</dt>
                <dd className="mt-0.5 text-slate-900">{service.title_de} <span className="text-slate-500">· {service.title_en}</span></dd>
              </div>
            )}
            {booking.special_requirements && (
              <div className="col-span-2 border-t border-slate-100 pt-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Special requirements</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-slate-700">{booking.special_requirements}</dd>
              </div>
            )}
          </dl>
        </AdminCard>

        <AdminCard eyebrow="Customer" title={booking.customer_name} serif>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
              <a href={`mailto:${booking.customer_email}`} className="text-slate-900 hover:underline">{booking.customer_email}</a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
              <a href={`tel:${booking.customer_phone}`} className="text-slate-900 hover:underline">{booking.customer_phone}</a>
            </div>
            {booking.is_business && (
              <div className="col-span-2 border-t border-slate-100 pt-3">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Business</dt>
                <dd className="mt-0.5 text-slate-900">{booking.company_name}</dd>
                {booking.company_vatid && <dd className="text-[11.5px] text-slate-500">VAT: {booking.company_vatid}</dd>}
              </div>
            )}
          </dl>
        </AdminCard>

        <AdminCard eyebrow="Internal" title="Operations notes" serif>
          <AdminFormField label="Notes (admin only)">
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={4}
              className={adminTextareaClass}
              placeholder="Anything operations should know — driver assignment, callbacks…"
            />
          </AdminFormField>
        </AdminCard>
      </div>

      <aside className="space-y-4">
        <AdminCard eyebrow="Status" title={STATUS_LABELS[status]} serif>
          <div className="mb-3"><StatusPill status={status} /></div>
          <AdminFormField label="Change status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BookingStatus)}
              className="h-9 w-full border border-slate-300 bg-white px-2 text-[13px] text-slate-700 focus:border-slate-900 focus:outline-none"
            >
              {BOOKING_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </AdminFormField>
          <div className="mt-3">
            <AdminFormField label="Quoted price (€)" error={priceError ?? undefined}>
              <input
                type="text"
                inputMode="decimal"
                value={quotedPrice}
                onChange={(e) => setQuotedPrice(e.target.value)}
                placeholder="0.00"
                className={`${adminInputClass} tabular-nums`}
              />
            </AdminFormField>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={busy || !isDirty}
              className="flex h-9 items-center justify-center gap-2 bg-slate-900 px-4 text-[12.5px] font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save changes
            </button>
            <button
              type="button"
              onClick={() => printNode(document.getElementById("booking-printable"))}
              className="flex h-9 items-center justify-center gap-2 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              Print booking
            </button>
            <button
              type="button"
              onClick={() => printNode(document.getElementById("quote-printable"))}
              disabled={!booking.quoted_price_eur}
              className="flex h-9 items-center justify-center gap-2 border border-[#A8865A] bg-white px-3 text-[12.5px] font-medium text-[#86683F] hover:bg-[#FBF7F0] disabled:opacity-40"
            >
              <FileText className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              Print quote (€{booking.quoted_price_eur ?? "—"})
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="mt-1 flex h-9 items-center justify-center gap-2 border border-red-200 bg-white px-3 text-[12.5px] font-medium text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              Delete booking
            </button>
          </div>
        </AdminCard>

        <AdminCard eyebrow="Timeline" title="Audit" serif>
          <dl className="space-y-2 text-[11.5px]">
            <div className="flex items-baseline justify-between">
              <dt className="text-slate-500">Created</dt>
              <dd className="tabular-nums text-slate-900">{new Date(booking.created_at).toLocaleString("en-GB")}</dd>
            </div>
            {booking.quoted_at && (
              <div className="flex items-baseline justify-between">
                <dt className="text-slate-500">Quoted</dt>
                <dd className="tabular-nums text-slate-900">{new Date(booking.quoted_at).toLocaleString("en-GB")}</dd>
              </div>
            )}
            {booking.completed_at && (
              <div className="flex items-baseline justify-between">
                <dt className="text-slate-500">Completed</dt>
                <dd className="tabular-nums text-slate-900">{new Date(booking.completed_at).toLocaleString("en-GB")}</dd>
              </div>
            )}
          </dl>
        </AdminCard>
      </aside>

      <div id="quote-printable" className="hidden">
        <div style={{ padding: 32 }}>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, marginBottom: 4 }}>StepNow — Price quote</h1>
          <p style={{ color: "#5A5A5A", fontSize: 12, marginBottom: 24 }}>Reference {booking.reference}</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              <tr><td style={{ padding: "6px 0", color: "#5A5A5A" }}>Customer</td><td style={{ textAlign: "right" }}>{booking.customer_name}</td></tr>
              <tr><td style={{ padding: "6px 0", color: "#5A5A5A" }}>When</td><td style={{ textAlign: "right" }}>{when}</td></tr>
              <tr><td style={{ padding: "6px 0", color: "#5A5A5A" }}>From</td><td style={{ textAlign: "right" }}>{booking.pickup_address}</td></tr>
              <tr><td style={{ padding: "6px 0", color: "#5A5A5A" }}>To</td><td style={{ textAlign: "right" }}>{booking.destination_address}</td></tr>
              <tr><td style={{ padding: "6px 0", color: "#5A5A5A" }}>Passengers</td><td style={{ textAlign: "right" }}>{booking.passenger_count}</td></tr>
              <tr style={{ borderTop: "1px solid #D8D5CE" }}>
                <td style={{ padding: "12px 0", fontWeight: 600 }}>Total</td>
                <td style={{ padding: "12px 0", textAlign: "right", fontFamily: "Georgia, serif", fontSize: 22 }}>
                  €{booking.quoted_price_eur ?? "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this booking?"
        description="It will be soft-deleted and removed from the kanban. You can restore via the audit log."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => { setConfirmDelete(false); void onDelete(); }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
