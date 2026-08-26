// apps/frontend/src/app/admin/(authed)/bookings/[id]/_detail.tsx
// Booking detail: the route, the customer's own request, one-tap contact, status/quote changer.
// The reference belongs to the page header and is never repeated down here.

"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase, Building2, FileText, Loader2, Mail, MapPin, MessageSquare, MessageSquareQuote,
  Phone, Printer, Save, Trash2, Users,
} from "lucide-react";
import {
  AdminCard, AdminFormField, ConfirmDialog, adminInputClass, adminTextareaClass,
} from "@/components/admin";
import { BOOKING_STATUSES, type BookingStatus, type BookingAdmin, type ServiceAdmin } from "@/types";
import { useDefaultCurrency } from "@/hooks/queries";
import { useUpdateBooking, useDeleteBooking } from "@/hooks/mutations/useBookingMutations";
import { useAdminToast } from "@/hooks/useAdminToast";
import { ApiError } from "@/lib/api-errors";
import { formatPrice } from "@/utils/formatters";
import { normalizeDecimalInput } from "@/utils/decimal";
import { printNode } from "@/utils/exporters";
import { cn } from "@/utils/cn";

interface Props { initial: BookingAdmin; service: ServiceAdmin | null; }

const LABEL = "text-[9.5px] font-semibold uppercase tracking-[0.20em] text-slate-400";

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

// Pickup and destination read as one connected journey rather than two sibling columns —
// the shape dispatchers already know from every run-sheet.
function RouteLine({ booking }: { booking: BookingAdmin }) {
  const origin = [booking.pickup_postcode, booking.pickup_city].filter(Boolean).join(" ");
  const target = [booking.destination_postcode, booking.destination_city].filter(Boolean).join(" ");
  return (
    <div className="grid grid-cols-[16px_minmax(0,1fr)] gap-x-3">
      <div className="flex flex-col items-center">
        <span aria-hidden="true" className="mt-[6px] h-[11px] w-[11px] shrink-0 rounded-full border-2 border-[#A8865A] bg-white" />
        <span aria-hidden="true" className="my-1 w-px flex-1 bg-slate-200" />
      </div>
      <div className="min-w-0 pb-5">
        <p className={LABEL}>From</p>
        <p className="mt-0.5 text-[13.5px] leading-snug text-slate-900">{booking.pickup_address}</p>
        {origin && <p className="text-[11.5px] text-slate-500">{origin}</p>}
      </div>
      <div className="flex justify-center">
        <MapPin className="mt-[3px] h-4 w-4 shrink-0 text-slate-900" strokeWidth={2} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className={LABEL}>To</p>
        <p className="mt-0.5 text-[13.5px] leading-snug text-slate-900">{booking.destination_address}</p>
        {target && <p className="text-[11.5px] text-slate-500">{target}</p>}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
      <span className={LABEL}>{label}</span>
      <span className="text-[13px] tabular-nums text-slate-900">{value}</span>
    </div>
  );
}

// The customer's own words decide the vehicle and the driver, so they get their own surface
// above the contact block instead of a grey row at the bottom of the trip table.
function CustomerRequest({ text }: { text: string }) {
  return (
    <section className="border border-[#E4D5BC] bg-[#FBF7F0] shadow-[0_1px_2px_0_rgba(15,23,42,0.03)]">
      <div className="flex gap-3 px-5 py-4">
        <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-[#A8865A]" strokeWidth={1.5} aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.20em] text-[#86683F]">
            What the customer asked for
          </p>
          <p className="mt-1.5 whitespace-pre-wrap font-serif text-[15px] leading-[1.55] text-slate-900">{text}</p>
        </div>
      </div>
    </section>
  );
}

function ContactAction({ icon: Icon, label, value, href, external }: {
  icon: LucideIcon; label: string; value: string; href: string; external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex items-center gap-2.5 border border-slate-200 px-3 py-2.5 transition-colors hover:border-slate-900 hover:bg-slate-50"
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-slate-900" strokeWidth={1.5} aria-hidden="true" />
      <span className="min-w-0">
        <span className={cn("block", LABEL)}>{label}</span>
        <span className="block truncate text-[13px] text-slate-900">{value}</span>
      </span>
    </a>
  );
}

export function BookingDetail({ initial, service }: Props) {
  const cur = useDefaultCurrency();
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const updateBooking = useUpdateBooking(initial.id);
  const deleteBooking = useDeleteBooking();
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
      const updated = await updateBooking.mutateAsync({
        id: booking.id,
        payload: { status, quoted_price_eur: normalized, internal_notes: internalNotes.trim() || null },
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
      await deleteBooking.mutateAsync(booking.id);
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
  const whatsapp = booking.customer_phone?.replace(/\D/g, "") || "";
  const quoted = booking.quoted_price_eur ? formatPrice(booking.quoted_price_eur, "en", cur) : "—";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4" id="booking-printable">
        <AdminCard eyebrow="Pickup" title={when} serif headerActions={<StatusPill status={status} />}>
          <RouteLine booking={booking} />
          <div className="mt-5 flex flex-wrap items-center gap-x-7 gap-y-2.5 border-t border-slate-100 pt-4">
            <Stat icon={Users} label="Passengers" value={booking.passenger_count} />
            <Stat icon={Briefcase} label="Luggage" value={booking.luggage_count} />
            {service && (
              <Stat
                icon={FileText}
                label="Service"
                value={<>{service.title_de} <span className="text-slate-500">· {service.title_en}</span></>}
              />
            )}
          </div>
        </AdminCard>

        {booking.special_requirements && <CustomerRequest text={booking.special_requirements} />}

        <AdminCard
          eyebrow="Customer"
          title={booking.customer_name}
          serif
          headerActions={booking.is_business ? (
            <span className="inline-flex items-center gap-1.5 border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-slate-600">
              <Building2 className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
              Business
            </span>
          ) : null}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <ContactAction icon={Mail} label="Email" value={booking.customer_email} href={`mailto:${booking.customer_email}`} />
            <ContactAction icon={Phone} label="Phone" value={booking.customer_phone} href={`tel:${booking.customer_phone}`} />
            {whatsapp && (
              <ContactAction icon={MessageSquare} label="WhatsApp" value="Open chat" href={`https://wa.me/${whatsapp}`} external />
            )}
          </div>
          {booking.is_business && (
            <dl className="mt-4 border-t border-slate-100 pt-3 text-[13px]">
              <dt className={LABEL}>Company</dt>
              <dd className="mt-0.5 text-slate-900">{booking.company_name}</dd>
              {booking.company_vatid && <dd className="text-[11.5px] text-slate-500">VAT {booking.company_vatid}</dd>}
            </dl>
          )}
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
            <AdminFormField label={`Quoted price (${cur})`} error={priceError ?? undefined}>
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
              Print quote ({quoted})
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
                <td style={{ padding: "12px 0", textAlign: "right", fontFamily: "Georgia, serif", fontSize: 22 }}>{quoted}</td>
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
