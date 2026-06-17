// src/hooks/queries/useCustomers.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import { getAdminCustomer, listAdminCustomers, listCustomerOrders, type CustomerAdmin } from "@/services/customers/customers.admin.client";
import type { CourierOrder } from "@/services/courier";
import type { Paginated } from "@/types";

/** Paginated customers list. */
export function useCustomers(
  params: { q?: string; page?: number; size?: number } = {},
  opts: { enabled?: boolean } = {},
) {
  return useQuery<Paginated<CustomerAdmin>>({
    queryKey: queryKeys.customers.list(params),
    queryFn: async () => {
      console.log(`🔄 useCustomers: Fetching customers`);
      const res = await listAdminCustomers(params);
      console.log(`✅ useCustomers: Fetched ${res.items.length} customers`);
      return res;
    },
    enabled: opts.enabled ?? true,
    staleTime: STALE_TIMES.STANDARD,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: false,
  });
}

/** Single customer by id. */
export function useCustomer(id: string, opts: { enabled?: boolean } = {}) {
  return useQuery<CustomerAdmin>({
    queryKey: queryKeys.customers.detail(id),
    queryFn: async () => {
      console.log(`🔄 useCustomer: Fetching ${id}`);
      const c = await getAdminCustomer(id);
      console.log(`✅ useCustomer: Fetched ${id}`);
      return c;
    },
    enabled: (opts.enabled ?? true) && Boolean(id),
    staleTime: STALE_TIMES.STANDARD,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: false,
  });
}

/** Order history for a customer (detail page). */
export function useCustomerOrders(id: string, opts: { enabled?: boolean } = {}) {
  return useQuery<CourierOrder[]>({
    queryKey: queryKeys.customers.orders(id),
    queryFn: async () => {
      console.log(`🔄 useCustomerOrders: Fetching ${id}`);
      const res = await listCustomerOrders(id);
      console.log(`✅ useCustomerOrders: Fetched ${res.length} orders`);
      return res;
    },
    enabled: (opts.enabled ?? true) && Boolean(id),
    staleTime: STALE_TIMES.STANDARD,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: false,
  });
}
