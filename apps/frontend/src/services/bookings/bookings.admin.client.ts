// src/services/bookings/bookings.admin.client.ts
// Admin client calls for bookings. In Phase 5a we only use list with size=1
// to fetch the total count for the dashboard. Full booking management is
// Phase 5c.

import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Paginated, BookingAdmin } from "@/types";

export interface ListAdminBookingsParams {
  page?: number;
  size?: number;
  status?: string;
}

export async function listAdminBookings(
  params: ListAdminBookingsParams = {},
): Promise<Paginated<BookingAdmin>> {
  return nextjsApiClient.get<Paginated<BookingAdmin>>("/admin/bookings", {
    params: { ...params },
  });
}
