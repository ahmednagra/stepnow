// src/services/bookings/bookings.admin.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Paginated, BookingAdmin, BookingStatus } from "@/types";

export interface ListAdminBookingsParams {
  page?: number;
  size?: number;
  status?: BookingStatus;
  q?: string;
  from_date?: string;
  to_date?: string;
  service_id?: string;
  include_deleted?: boolean;
}

export interface BookingStatusUpdateInput {
  status: BookingStatus;
  quoted_price_eur?: string | null;
  internal_notes?: string | null;
}

export async function listAdminBookings(
  params: ListAdminBookingsParams = {},
): Promise<Paginated<BookingAdmin>> {
  return nextjsApiClient.get<Paginated<BookingAdmin>>("/admin/bookings", {
    params: { ...params },
  });
}

export async function getAdminBooking(id: string): Promise<BookingAdmin> {
  return nextjsApiClient.get<BookingAdmin>(`/admin/bookings/${id}`);
}

export async function updateAdminBooking(
  id: string,
  payload: BookingStatusUpdateInput,
): Promise<BookingAdmin> {
  return nextjsApiClient.patch<BookingAdmin>(`/admin/bookings/${id}`, payload);
}

export async function deleteAdminBooking(id: string): Promise<void> {
  await nextjsApiClient.delete<void>(`/admin/bookings/${id}`);
}
