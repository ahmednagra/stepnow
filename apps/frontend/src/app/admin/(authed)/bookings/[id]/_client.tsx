// apps/frontend/src/app/admin/(authed)/bookings/[id]/_client.tsx
// Client island: fetches the booking + its linked service via React Query (browser bearer auth).

"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { BookingDetail } from "./_detail";
import { useBooking, useService } from "@/hooks/queries";

export function BookingDetailClient({ id }: { id: string }) {
  const { data: booking, isLoading, isError } = useBooking(id);
  const { data: service } = useService(booking?.service_id ?? "", { enabled: Boolean(booking?.service_id) });
  if (isLoading) return <div className="p-6 text-[13px] text-slate-500">Loading…</div>;
  if (isError || !booking) notFound();
  return (
    <>
      <AdminPageHeader
        eyebrow={`Booking · ${booking.reference}`}
        title={booking.customer_name}
        description={booking.customer_email}
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
