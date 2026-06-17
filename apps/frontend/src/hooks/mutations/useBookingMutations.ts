// src/hooks/mutations/useBookingMutations.ts
// React Query WRITE hooks for bookings. Each mutation calls the existing bookings client
// service, then invalidates the affected query keys so the kanban/list + detail re-fetch.

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  updateAdminBooking,
  deleteAdminBooking,
  type BookingStatusUpdateInput,
} from "@/services/bookings";

/** Update a booking (status / quote / notes). Invalidates list (+ detail when id known). */
export function useUpdateBooking(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id: bookingId, payload }: { id: string; payload: BookingStatusUpdateInput }) =>
      updateAdminBooking(bookingId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.lists() });
      if (id) void qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
    },
  });
}

/** Soft-delete a booking. Invalidates list + detail. */
export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminBooking(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.lists() });
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.detail(id) });
    },
  });
}
