// apps/frontend/src/services/bookings/bookings.admin.server.ts
// Admin bookings server service (BFF → FastAPI with bearer auth). Mutations bust public ISR tags.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { revalidateForPath } from "@/lib/revalidate";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, BookingAdmin } from "@/types";
import type { OrderDetail } from "@/services/orders";
import type { BookingsHeatmapResponse, UpcomingBookingsResponse } from "@/services/admin-dashboard";
import type { RevenueSeriesResponse, ServiceMixResponse } from "@/services/admin-stats";
import type { BookingStatusUpdateInput } from "./bookings.admin.client";

function unwrap<T>(result: ApiResponse<T>): T {
  if (result.error || result.data === undefined) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "Request failed",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}

export async function listAdminBookingsServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<Paginated<BookingAdmin>> {
  return unwrap(await serverApiClient.get<Paginated<BookingAdmin>>(ENDPOINTS.ADMIN.BOOKINGS, { params }, authToken));
}

export async function getAdminBookingServer(id: string, authToken: string): Promise<BookingAdmin> {
  return unwrap(await serverApiClient.get<BookingAdmin>(ENDPOINTS.ADMIN.BOOKING_BY_ID(id), undefined, authToken));
}

export async function updateAdminBookingServer(id: string, data: BookingStatusUpdateInput, authToken: string): Promise<BookingAdmin> {
  const b = unwrap(await serverApiClient.patch<BookingAdmin>(ENDPOINTS.ADMIN.BOOKING_BY_ID(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.BOOKINGS);
  return b;
}

export async function deleteAdminBookingServer(id: string, authToken: string): Promise<void> {
  const r = await serverApiClient.delete<void>(ENDPOINTS.ADMIN.BOOKING_BY_ID(id), undefined, authToken);
  if (r.error) throw new ApiError(r.error.code, r.error.message, r.status, r.error.extra);
  revalidateForPath(ENDPOINTS.ADMIN.BOOKINGS);
}

export async function convertBookingToOrderServer(id: string, data: Record<string, unknown>, authToken: string): Promise<OrderDetail> {
  const o = unwrap(await serverApiClient.post<OrderDetail>(ENDPOINTS.ADMIN.BOOKING_CONVERT_TO_ORDER(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.BOOKINGS);
  return o;
}

export async function getAdminBookingsHeatmapServer(authToken: string): Promise<BookingsHeatmapResponse> {
  return unwrap(await serverApiClient.get<BookingsHeatmapResponse>(ENDPOINTS.ADMIN.BOOKINGS_HEATMAP, undefined, authToken));
}

export async function getAdminBookingsRevenueSeriesServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<RevenueSeriesResponse> {
  return unwrap(await serverApiClient.get<RevenueSeriesResponse>(ENDPOINTS.ADMIN.BOOKINGS_REVENUE_SERIES, { params }, authToken));
}

export async function getAdminBookingsServiceMixServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<ServiceMixResponse> {
  return unwrap(await serverApiClient.get<ServiceMixResponse>(ENDPOINTS.ADMIN.BOOKINGS_SERVICE_MIX, { params }, authToken));
}

export async function getAdminBookingsUpcomingServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<UpcomingBookingsResponse> {
  return unwrap(await serverApiClient.get<UpcomingBookingsResponse>(ENDPOINTS.ADMIN.BOOKINGS_UPCOMING, { params }, authToken));
}
