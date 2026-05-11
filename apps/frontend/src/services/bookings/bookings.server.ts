// src/services/bookings/bookings.server.ts
import { serverApiClient } from "@/lib/server-api";
import { ApiError } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { BookingCreate, BookingSubmitted } from "@/types";

/**
 * Submit a booking from the BFF route to FastAPI.
 * Public endpoint — no auth token. Rate-limited server-side.
 */
export async function submitBookingServer(data: BookingCreate): Promise<BookingSubmitted> {
  const result = await serverApiClient.post<BookingSubmitted>(ENDPOINTS.PUBLIC.BOOKINGS, data);

  if (result.error || !result.data) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "Booking submission failed",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}
