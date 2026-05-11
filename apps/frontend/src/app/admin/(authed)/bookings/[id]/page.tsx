// src/app/admin/(authed)/bookings/[id]/page.tsx
import { notFound } from "next/navigation";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { BookingAdmin, ServiceAdmin } from "@/types";
import { AdminPageHeader } from "@/components/admin";
import { BookingDetail } from "./_detail";

export const dynamic = "force-dynamic";

async function loadBooking(id: string): Promise<{
  booking: BookingAdmin | null;
  service: ServiceAdmin | null;
}> {
  const token = await getAccessTokenFromCookies();
  if (!token) return { booking: null, service: null };

  const bookingRes = await serverApiClient.get<BookingAdmin>(
    ENDPOINTS.ADMIN.BOOKING_BY_ID(id),
    undefined,
    token,
  );
  const booking = bookingRes.data ?? null;

  let service: ServiceAdmin | null = null;
  if (booking?.service_id) {
    const svcRes = await serverApiClient.get<ServiceAdmin>(
      ENDPOINTS.ADMIN.SERVICE_BY_ID(booking.service_id),
      undefined,
      token,
    );
    service = svcRes.data ?? null;
  }

  return { booking, service };
}

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const { booking, service } = await loadBooking(params.id);
  if (!booking) notFound();

  return (
    <>
      <AdminPageHeader
        title={booking.reference}
        description={`${booking.customer_name} · ${booking.customer_email}`}
      />
      <div className="p-6">
        <BookingDetail initial={booking} service={service} />
      </div>
    </>
  );
}
