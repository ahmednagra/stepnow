// src/hooks/queries/useOrders.ts
// React Query READ hooks for the order lifecycle. One base list hook + detail + payments slices.
// Orders are operational, so they use the DYNAMIC freshness tier (short stale, refetch on focus).
// All fetching goes through the existing orders client service (browser → /api/v0 BFF → backend).

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import {
  listAdminOrders,
  getAdminOrder,
  listOrderPayments,
  listInvoices,
  getInvoice,
  type ListAdminOrdersParams,
  type OrderAdmin,
  type OrderDetail,
  type PaymentAdmin,
  type InvoiceAdmin,
  type InvoiceListItem,
} from "@/services/orders";
import type { Paginated } from "@/types";

interface QueryOptions {
  enabled?: boolean;
}

/** Paginated, filterable orders list (operations console). */
export function useOrders(params: ListAdminOrdersParams = {}, options: QueryOptions = {}) {
  return useQuery<Paginated<OrderAdmin>>({
    queryKey: queryKeys.orders.list(params),
    queryFn: async () => {
      console.log(`🔄 useOrders: Fetching orders`);
      const res = await listAdminOrders(params);
      console.log(`✅ useOrders: Fetched ${res.items.length} orders`);
      return res;
    },
    enabled: options.enabled ?? true,
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: true,
  });
}

/** A single order with its invoice + payments (detail page). */
export function useOrder(orderId: string, options: QueryOptions = {}) {
  return useQuery<OrderDetail>({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: async () => {
      console.log(`🔄 useOrder: Fetching ${orderId}`);
      const res = await getAdminOrder(orderId);
      console.log(`✅ useOrder: Fetched ${orderId}`);
      return res;
    },
    enabled: (options.enabled ?? true) && Boolean(orderId),
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: true,
  });
}

/** Bills (invoices) list for the bills console. */
export function useInvoices(params: { page?: number; size?: number; status?: string; q?: string } = {}, options: QueryOptions = {}) {
  return useQuery<Paginated<InvoiceListItem>>({
    queryKey: queryKeys.invoices.list(params),
    queryFn: async () => {
      console.log(`🔄 useInvoices: Fetching bills`);
      const res = await listInvoices(params);
      console.log(`✅ useInvoices: Fetched ${res.items.length} bills`);
      return res;
    },
    enabled: options.enabled ?? true,
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: true,
  });
}

/** A single bill (invoice) for the editor. */
export function useInvoice(invoiceId: string, options: QueryOptions = {}) {
  return useQuery<InvoiceAdmin>({
    queryKey: queryKeys.invoices.detail(invoiceId),
    queryFn: async () => {
      console.log(`🔄 useInvoice: Fetching ${invoiceId}`);
      const res = await getInvoice(invoiceId);
      console.log(`✅ useInvoice: Fetched ${invoiceId}`);
      return res;
    },
    enabled: (options.enabled ?? true) && Boolean(invoiceId),
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: false,
  });
}

/** Payment ledger for one order (used where only the ledger is needed). */
export function useOrderPayments(orderId: string, options: QueryOptions = {}) {
  return useQuery<PaymentAdmin[]>({
    queryKey: queryKeys.orders.payments(orderId),
    queryFn: async () => {
      console.log(`🔄 useOrderPayments: Fetching ${orderId}`);
      const res = await listOrderPayments(orderId);
      console.log(`✅ useOrderPayments: Fetched ${res.length} payments`);
      return res;
    },
    enabled: (options.enabled ?? true) && Boolean(orderId),
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.SHORT,
    refetchOnWindowFocus: true,
  });
}
