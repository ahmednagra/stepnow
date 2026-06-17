// src/hooks/queries/useDrivers.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import { getAdminDriver, listAdminDrivers, listDriverOrders, type DriverAdmin, type ListDriversParams } from "@/services/drivers/drivers.admin.client";
import type { CourierOrder } from "@/services/courier";
import type { Paginated } from "@/types";

/** Paginated drivers list. */
export function useDrivers(params: ListDriversParams = {}, opts: { enabled?: boolean } = {}) {
  return useQuery<Paginated<DriverAdmin>>({
    queryKey: queryKeys.drivers.list(params as Record<string, unknown>),
    queryFn: async () => {
      console.log(`🔄 useDrivers: Fetching drivers`);
      const res = await listAdminDrivers(params);
      console.log(`✅ useDrivers: Fetched ${res.items.length} drivers`);
      return res;
    },
    enabled: opts.enabled ?? true,
    staleTime: STALE_TIMES.STANDARD,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: false,
  });
}

/** Single driver by id. */
export function useDriver(id: string, opts: { enabled?: boolean } = {}) {
  return useQuery<DriverAdmin>({
    queryKey: queryKeys.drivers.detail(id),
    queryFn: async () => {
      console.log(`🔄 useDriver: Fetching ${id}`);
      const d = await getAdminDriver(id);
      console.log(`✅ useDriver: Fetched ${id}`);
      return d;
    },
    enabled: (opts.enabled ?? true) && Boolean(id),
    staleTime: STALE_TIMES.STANDARD,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: false,
  });
}

/** Job history for a driver. */
export function useDriverOrders(id: string, opts: { enabled?: boolean } = {}) {
  return useQuery<CourierOrder[]>({
    queryKey: queryKeys.drivers.orders(id),
    queryFn: async () => {
      console.log(`🔄 useDriverOrders: Fetching ${id}`);
      const res = await listDriverOrders(id);
      console.log(`✅ useDriverOrders: Fetched ${res.length} jobs`);
      return res;
    },
    enabled: (opts.enabled ?? true) && Boolean(id),
    staleTime: STALE_TIMES.STANDARD,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: false,
  });
}
