// src/hooks/queries/useBookings.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import {
  getAdminBooking,
  listAdminBookings,
  type ListAdminBookingsParams,
} from "@/services/bookings/bookings.admin.client";
import type { Paginated, BookingAdmin } from "@/types";

/** Paginated bookings list. */
export function useBookings(params: ListAdminBookingsParams = {}, opts: { enabled?: boolean } = {}) {
  return useQuery<Paginated<BookingAdmin>>({
    queryKey: queryKeys.bookings.list(params as Record<string, unknown>),
    queryFn: async () => {
      console.log(`🔄 useBookings: Fetching bookings`);
      const res = await listAdminBookings(params);
      console.log(`✅ useBookings: Fetched ${res.items.length} bookings`);
      return res;
    },
    enabled: opts.enabled ?? true,
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: true,
  });
}

/** Single booking by id. */
export function useBooking(id: string, opts: { enabled?: boolean } = {}) {
  return useQuery<BookingAdmin>({
    queryKey: queryKeys.bookings.detail(id),
    queryFn: async () => {
      console.log(`🔄 useBooking: Fetching ${id}`);
      const b = await getAdminBooking(id);
      console.log(`✅ useBooking: Fetched ${id}`);
      return b;
    },
    enabled: (opts.enabled ?? true) && Boolean(id),
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: true,
  });
}
