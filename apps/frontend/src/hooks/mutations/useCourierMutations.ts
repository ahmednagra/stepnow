// src/hooks/mutations/useCourierMutations.ts
// React Query WRITE hooks for the parcel-dispatch feature (manual courier orders + delivery
// lifecycle). Courier/parcel orders are orders, so each mutation invalidates the orders list.
// Each mutation calls the existing courier admin client service.

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  createParcelOrder,
  updateParcelOrder,
  setDeliveryStatus,
  type ParcelOrderInput,
  type DeliveryStatus,
} from "@/services/courier";

/** Create a manual courier/parcel order. Invalidates the orders list. */
export function useCreateParcelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ParcelOrderInput) => createParcelOrder(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
}

/** Update a courier/parcel order. Invalidates the orders list. */
export function useUpdateParcelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: ParcelOrderInput }) =>
      updateParcelOrder(orderId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
}

/** Advance the delivery lifecycle (draft → dispatched → picked_up → delivered). */
export function useSetDeliveryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, delivery_status }: { orderId: string; delivery_status: DeliveryStatus }) =>
      setDeliveryStatus(orderId, delivery_status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
}
