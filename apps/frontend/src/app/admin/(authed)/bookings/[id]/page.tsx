// apps/frontend/src/app/admin/(authed)/bookings/[id]/page.tsx
// Booking detail. Loads booking + linked service, feeds to BookingDetail client island.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { BookingAdmin, ServiceAdmin } from "@/types";
import { AdminPageHeader } from "@/components/admin";
import { BookingDetail } from "./_detail";

export const dynamic = "force-dynamic";

async function loadBooking(id: string): Promise<{ booking: BookingAdmin | null; service: ServiceAdmin | null }> {
  const token = await getAccessTokenFromCookies();
  if (!token) return { booking: null, service: null };
  const bookingRes = await serverApiClient.get<BookingAdmin>(ENDPOINTS.ADMIN.BOOKING_BY_ID(id), undefined, token);
  const booking = bookingRes.data ?? null;
  let service: ServiceAdmin | null = null;
  if (booking?.service_id) {
    const svcRes = await serverApiClient.get<ServiceAdmin>(ENDPOINTS.ADMIN.SERVICE_BY_ID(booking.service_id), undefined, token);
    service = svcRes.data ?? null;
  }
  return { booking, service };
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const { booking } = await loadBooking(params.id);
  return { title: booking ? `${booking.reference} · Bookings · StepNow Admin` : "Booking · StepNow Admin" };
}

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const { booking, service } = await loadBooking(params.id);
  if (!booking) notFound();
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
      <div className="p-6"><BookingDetail initial={booking} service={service} /></div>
    </>
  );
}
