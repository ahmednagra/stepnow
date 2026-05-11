// src/app/admin/(authed)/bookings/[id]/_detail.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, Trash2, Mail, Phone, MapPin, Calendar, Users, Briefcase } from "lucide-react";
import {
  AdminCard,
  AdminFormField,
  BookingStatusBadge,
  BOOKING_STATUS_LABELS,
  ConfirmDialog,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin";
import { BOOKING_STATUSES, type BookingStatus, type BookingAdmin, type ServiceAdmin } from "@/types";
import {
  updateAdminBooking,
  deleteAdminBooking,
} from "@/services/bookings";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { normalizeDecimalInput } from "@/utils/decimal";

interface BookingDetailProps {
  initial: BookingAdmin;
  service: ServiceAdmin | null;
}

export function BookingDetail({ initial, service }: BookingDetailProps) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const [booking, setBooking] = useState<BookingAdmin>(initial);
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Local form state for the editable fields
  const [status, setStatus] = useState<BookingStatus>(initial.status);
  const [quotedPrice, setQuotedPrice] = useState<string>(initial.quoted_price_eur ?? "");
  const [internalNotes, setInternalNotes] = useState<string>(initial.internal_notes ?? "");
  const [priceError, setPriceError] = useState<string | null>(null);

  const isDirty =
    status !== booking.status ||
    quotedPrice !== (booking.quoted_price_eur ?? "") ||
    internalNotes !== (booking.internal_notes ?? "");

  async function onSave() {
    setServerError(null);
    setPriceError(null);
    setBusy(true);

    let normalizedPrice: string | null = null;
    if (quotedPrice.trim()) {
      normalizedPrice = normalizeDecimalInput(quotedPrice);
      if (normalizedPrice === null) {
        setPriceError("Enter a valid amount (e.g. 45.50 or 45,50)");
        setBusy(false);
        return;
      }
    }

    try {
      const updated = await updateAdminBooking(booking.id, {
        status,
        quoted_price_eur: normalizedPrice,
        internal_notes: internalNotes.trim() || null,
      });
      setBooking(updated);
      setStatus(updated.status);
      setQuotedPrice(updated.quoted_price_eur ?? "");
      setInternalNotes(updated.internal_notes ?? "");
      pushToast("success", "Booking updated");
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Network error";
      setServerError(msg);
      pushToast("error", "Save failed", msg);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    setBusy(true);
    try {
      await deleteAdminBooking(booking.id);
      pushToast("success", "Booking deleted");
      router.push("/admin/bookings");
      router.refresh();
    } catch (err) {
      pushToast(
        "error",
        "Delete failed",
        err instanceof ApiError ? err.message : "Network error",
      );
      setBusy(false);
    }
  }

  const requested = new Date(booking.requested_datetime);
  const requestedStr = requested.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Sticky action bar */}
      <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
        <div className="flex items-center gap-3">
          <BookingStatusBadge status={booking.status} />
          <p className="text-[12px] text-slate-500">
            {isDirty ? "You have unsaved changes." : "All changes saved."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/bookings"
            className="flex h-9 items-center border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
          >
            Back
          </Link>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
            className="flex h-9 items-center gap-1.5 border border-red-200 bg-white px-3 text-[13px] font-medium text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={busy || !isDirty}
            className="flex h-9 items-center gap-2 bg-slate-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save
          </button>
        </div>
      </div>

      {serverError && (
        <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {serverError}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: customer + trip details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <AdminCard title="Customer">
            <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Name</dt>
                <dd className="text-[13px] text-slate-900">{booking.customer_name}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Language</dt>
                <dd className="text-[13px] uppercase text-slate-900">{booking.language}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  <Mail className="h-2.5 w-2.5" /> Email
                </dt>
                <dd className="text-[13px] text-slate-900">
                  <a href={`mailto:${booking.customer_email}`} className="hover:underline">
                    {booking.customer_email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  <Phone className="h-2.5 w-2.5" /> Phone
                </dt>
                <dd className="text-[13px] text-slate-900">
                  <a href={`tel:${booking.customer_phone}`} className="hover:underline">
                    {booking.customer_phone}
                  </a>
                </dd>
              </div>
              {booking.is_business && (
                <>
                  <div>
                    <dt className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                      <Briefcase className="h-2.5 w-2.5" /> Company
                    </dt>
                    <dd className="text-[13px] text-slate-900">{booking.company_name ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-400">VAT ID</dt>
                    <dd className="text-[13px] text-slate-900">{booking.company_vatid ?? "—"}</dd>
                  </div>
                </>
              )}
            </dl>
          </AdminCard>

          <AdminCard title="Trip">
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  <Calendar className="h-2.5 w-2.5" /> When
                </dt>
                <dd className="text-[13px] text-slate-900">{requestedStr}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  <MapPin className="h-2.5 w-2.5" /> Pickup
                </dt>
                <dd className="text-[13px] text-slate-900">
                  {booking.pickup_address}
                  {booking.pickup_postcode && `, ${booking.pickup_postcode}`}
                  {booking.pickup_city && ` ${booking.pickup_city}`}
                </dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  <MapPin className="h-2.5 w-2.5" /> Destination
                </dt>
                <dd className="text-[13px] text-slate-900">
                  {booking.destination_address}
                  {booking.destination_postcode && `, ${booking.destination_postcode}`}
                  {booking.destination_city && ` ${booking.destination_city}`}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div>
                  <dt className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-slate-400">
                    <Users className="h-2.5 w-2.5" /> Passengers
                  </dt>
                  <dd className="text-[13px] tabular-nums text-slate-900">{booking.passenger_count}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Luggage</dt>
                  <dd className="text-[13px] tabular-nums text-slate-900">{booking.luggage_count}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Service</dt>
                  <dd className="text-[13px] text-slate-900">{service?.title_de ?? "—"}</dd>
                </div>
              </div>
              {booking.special_requirements && (
                <div>
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                    Special requirements
                  </dt>
                  <dd className="whitespace-pre-wrap text-[13px] text-slate-900">
                    {booking.special_requirements}
                  </dd>
                </div>
              )}
            </dl>
          </AdminCard>
        </div>

        {/* Right: admin-only fields */}
        <div className="flex flex-col gap-6">
          <AdminCard title="Status & quote">
            <div className="flex flex-col gap-4">
              <AdminFormField label="Status">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BookingStatus)}
                  className={adminInputClass}
                  disabled={busy}
                >
                  {BOOKING_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {BOOKING_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </AdminFormField>
              <AdminFormField
                label="Quoted price (EUR)"
                hint="optional"
                helper="e.g. 45.50 or 45,50"
                error={priceError ?? undefined}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={quotedPrice}
                  onChange={(e) => setQuotedPrice(e.target.value)}
                  className={`${adminInputClass} tabular-nums`}
                  disabled={busy}
                />
              </AdminFormField>
            </div>
          </AdminCard>

          <AdminCard title="Internal notes" description="Visible to admins only.">
            <AdminFormField label="Notes">
              <textarea
                rows={8}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                className={adminTextareaClass}
                disabled={busy}
                placeholder="Followup notes, quoted-price reasoning, special arrangements…"
              />
            </AdminFormField>
          </AdminCard>

          <AdminCard title="Metadata">
            <dl className="flex flex-col gap-2 text-[11px]">
              <div className="flex justify-between">
                <dt className="text-slate-400">Created</dt>
                <dd className="tabular-nums text-slate-700">
                  {new Date(booking.created_at).toLocaleString("en-GB")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Updated</dt>
                <dd className="tabular-nums text-slate-700">
                  {new Date(booking.updated_at).toLocaleString("en-GB")}
                </dd>
              </div>
              {booking.quoted_at && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Quoted</dt>
                  <dd className="tabular-nums text-slate-700">
                    {new Date(booking.quoted_at).toLocaleString("en-GB")}
                  </dd>
                </div>
              )}
              {booking.completed_at && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Completed</dt>
                  <dd className="tabular-nums text-slate-700">
                    {new Date(booking.completed_at).toLocaleString("en-GB")}
                  </dd>
                </div>
              )}
            </dl>
          </AdminCard>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this booking?"
        body="The booking will be soft-deleted and removed from the kanban board. Database row remains."
        confirmLabel="Delete"
        onConfirm={() => {
          setConfirmDelete(false);
          void onDelete();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
