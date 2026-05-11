// src/services/bookings/bookings.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { BookingCreate, BookingSubmitted } from "@/types";

export async function submitBooking(data: BookingCreate): Promise<BookingSubmitted> {
  return nextjsApiClient.post<BookingSubmitted>("/public/bookings", data);
}
