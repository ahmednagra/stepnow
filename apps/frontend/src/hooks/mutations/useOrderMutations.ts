// src/hooks/mutations/useOrderMutations.ts
// React Query WRITE hooks for the order → invoice → payment lifecycle. Every money-touching write
// can change derived state elsewhere (paid/overdue flags, invoice status, the vehicle account,
// dashboard totals), so each one invalidates the billing ROOT keys instead of guessing sub-keys.
// updateAdminOrder is optimistic on the detail cache (status feels instant), with rollback.

"use client";

import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  convertBookingToOrder,
  updateAdminOrder,
  deleteAdminOrder,
  createOrderInvoice,
  recordOrderPayment,
  updateInvoice,
  issueInvoice,
  cancelInvoice,
  setPaymentStatus,
  type ConvertBookingInput,
  type CreateInvoiceInput,
  type InvoiceUpdateInput,
  type RecordPaymentInput,
  type OrderDetail,
  type OrderStatus,
  type PaymentStatus,
} from "@/services/orders";

type UpdateOrderInput = {
  status?: OrderStatus;
  driver_name?: string | null;
  internal_notes?: string | null;
};

/** Orders, bills, vehicle accounts, customer/driver job lists and dashboard totals all derive
 *  from the same ledger — the same key set the realtime `orders.*` events invalidate. */
export function invalidateBilling(qc: QueryClient) {
  for (const queryKey of [
    queryKeys.orders.all, queryKeys.invoices.all, queryKeys.vehicleLedger.all,
    queryKeys.customers.all, queryKeys.drivers.all, queryKeys.dashboard.all,
  ]) void qc.invalidateQueries({ queryKey });
}

/** Convert a booking into an order. The booking flips to confirmed, so bookings refresh too. */
export function useConvertBookingToOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, payload }: { bookingId: string; payload: ConvertBookingInput }) =>
      convertBookingToOrder(bookingId, payload),
    onSuccess: () => {
      invalidateBilling(qc);
      void qc.invalidateQueries({ queryKey: queryKeys.bookings.all });
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
    onSettled: () => invalidateBilling(qc),
  });
}

/** Soft-delete an order. */
export function useDeleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => deleteAdminOrder(orderId),
    onSuccess: () => invalidateBilling(qc),
  });
}

/** Create the order's bill — the first one, or the replacement after a Storno. */
export function useCreateOrderInvoice(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateInvoiceInput) => createOrderInvoice(orderId, payload),
    onSuccess: () => invalidateBilling(qc),
  });
}

/** Edit a draft bill (recipient, base net, line items, Skonto…). */
export function useUpdateInvoice(invoiceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InvoiceUpdateInput) => updateInvoice(invoiceId, payload),
    onSuccess: () => invalidateBilling(qc),
  });
}

/** Issue a draft bill — it becomes a frozen Buchungsbeleg. */
export function useIssueInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: string) => issueInvoice(invoiceId),
    onSuccess: () => invalidateBilling(qc),
  });
}

/** Storno an issued bill. */
export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, reason }: { invoiceId: string; reason?: string }) => cancelInvoice(invoiceId, reason),
    onSuccess: () => invalidateBilling(qc),
  });
}

/** Record a payment against an order. */
export function useRecordOrderPayment(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordPaymentInput) => recordOrderPayment(orderId, payload),
    onSuccess: () => invalidateBilling(qc),
  });
}

/** Refund a received payment (or settle a pending one). */
export function useSetPaymentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, status }: { paymentId: string; status: Exclude<PaymentStatus, "pending"> }) =>
      setPaymentStatus(paymentId, status),
    onSuccess: () => invalidateBilling(qc),
  });
}
