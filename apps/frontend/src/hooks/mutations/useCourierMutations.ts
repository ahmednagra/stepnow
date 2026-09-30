// src/hooks/mutations/useCourierMutations.ts
// React Query WRITE hooks for the parcel-dispatch feature (manual courier orders + delivery
// lifecycle). Courier/parcel orders are orders: price, vehicle and status feed the bills, the vehicle
// account and the dashboard, so each mutation invalidates the billing root keys.
// Each mutation calls the existing courier admin client service.

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateBilling } from "./useOrderMutations";
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
    onSuccess: () => invalidateBilling(qc),
  });
}

/** Update a courier/parcel order. Invalidates the orders list. */
export function useUpdateParcelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: ParcelOrderInput }) =>
      updateParcelOrder(orderId, payload),
    onSuccess: () => invalidateBilling(qc),
  });
}

/** Advance the delivery lifecycle (draft → dispatched → picked_up → delivered). */
export function useSetDeliveryStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, delivery_status }: { orderId: string; delivery_status: DeliveryStatus }) =>
      setDeliveryStatus(orderId, delivery_status),
    onSuccess: () => invalidateBilling(qc),
  });
}
