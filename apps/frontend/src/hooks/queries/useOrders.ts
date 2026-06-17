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
  type ListAdminOrdersParams,
  type OrderAdmin,
  type OrderDetail,
  type PaymentAdmin,
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
