// apps/frontend/src/app/admin/(authed)/bookings/[id]/_client.tsx
// Client island: fetches the booking + its linked service via React Query (browser bearer auth).
// Owns the one place the reference appears — a copyable chip, since dispatch pastes it constantly.

"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Copy } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { BookingDetail } from "./_detail";
import { useBooking, useService } from "@/hooks/queries";

function ReferenceChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title="Copy reference"
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        });
      }}
      className="group flex h-9 items-center gap-2 border border-slate-300 bg-white px-3 font-mono text-[13px] tracking-[0.06em] text-slate-900 transition-colors hover:border-slate-900"
    >
      {value}
      {copied
        ? <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} aria-hidden="true" />
        : <Copy className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-slate-900" strokeWidth={1.5} aria-hidden="true" />}
      <span className="sr-only">{copied ? "Reference copied" : "Copy reference"}</span>
    </button>
  );
}

export function BookingDetailClient({ id }: { id: string }) {
  const { data: booking, isLoading, isError } = useBooking(id);
  const { data: service } = useService(booking?.service_id ?? "", { enabled: Boolean(booking?.service_id) });
  if (isLoading) return <div className="p-6 text-[13px] text-slate-500">Loading…</div>;
  if (isError || !booking) notFound();
  return (
    <>
      <AdminPageHeader
        eyebrow="Booking"
        title={booking.customer_name}
        description={booking.customer_email}
        center={<ReferenceChip value={booking.reference} />}
        actions={
          <Link
            href="/admin/bookings"
            className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            All bookings
          </Link>
        }
      />
      <div className="p-6"><BookingDetail initial={booking} service={service ?? null} /></div>
    </>
  );
}
