// src/hooks/mutations/useOrderMutations.ts
// React Query WRITE hooks for the order lifecycle. Each mutation calls the existing orders
// client service, then invalidates the affected query keys so the list + detail re-fetch.
// updateAdminOrder is optimistic on the detail cache (status feels instant), with rollback.

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  convertBookingToOrder,
  updateAdminOrder,
  deleteAdminOrder,
  createOrderInvoice,
  recordOrderPayment,
  type ConvertBookingInput,
  type CreateInvoiceInput,
  type RecordPaymentInput,
  type OrderDetail,
  type OrderStatus,
} from "@/services/orders";

type UpdateOrderInput = {
  status?: OrderStatus;
  driver_name?: string | null;
  internal_notes?: string | null;
};

/** Convert a booking into an order. Invalidates the orders list. */
export function useConvertBookingToOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload: ConvertBookingInput }) =>
      convertBookingToOrder(bookingId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
}

/** Update an order (status / driver / notes). Optimistic on the detail cache. */
export function useUpdateOrder(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateOrderInput) => updateAdminOrder(orderId, payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: queryKeys.orders.detail(orderId) });
      const previous = qc.getQueryData<OrderDetail>(queryKeys.orders.detail(orderId));
      if (previous) {
        qc.setQueryData<OrderDetail>(queryKeys.orders.detail(orderId), {
          ...previous,
          ...payload,
        });
      }
      return { previous };
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(queryKeys.orders.detail(orderId), ctx.previous);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      void qc.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
}

/** Soft-delete an order. Invalidates list + detail. */
export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => deleteAdminOrder(orderId),
    onSuccess: (_data, orderId) => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      void qc.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
    },
  });
}

/** Create the optional invoice for an order. Invalidates that order's detail. */
export function useCreateOrderInvoice(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoiceInput) => createOrderInvoice(orderId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      void qc.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
}

/** Record a payment against an order. Invalidates detail + payments + list. */
export function useRecordOrderPayment(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordPaymentInput) => recordOrderPayment(orderId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.detail(orderId) });
      void qc.invalidateQueries({ queryKey: queryKeys.orders.payments(orderId) });
      void qc.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
}
