// src/hooks/queries/useVehicles.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import { getAdminVehicle, listAdminVehicles, getVehicleLedger, type VehicleLedger } from "@/services/vehicles/vehicles.admin.client";
import type { Paginated, VehicleAdmin } from "@/types";

/** Paginated vehicles list. */
export function useVehicles(
  params: { q?: string; include_deleted?: boolean; page?: number; size?: number } = {},
  opts: { enabled?: boolean } = {},
) {
  return useQuery<Paginated<VehicleAdmin>>({
    queryKey: queryKeys.vehicles.list(params),
    queryFn: async () => {
      console.log(`🔄 useVehicles: Fetching vehicles`);
      const res = await listAdminVehicles(params);
      console.log(`✅ useVehicles: Fetched ${res.items.length} vehicles`);
      return res;
    },
    enabled: opts.enabled ?? true,
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/** Single vehicle by id. */
export function useVehicle(id: string, opts: { enabled?: boolean } = {}) {
  return useQuery<VehicleAdmin>({
    queryKey: queryKeys.vehicles.detail(id),
    queryFn: async () => {
      console.log(`🔄 useVehicle: Fetching ${id}`);
      const v = await getAdminVehicle(id);
      console.log(`✅ useVehicle: Fetched ${id}`);
      return v;
    },
    enabled: (opts.enabled ?? true) && Boolean(id),
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
  });
}

/** Per-vehicle account (ledger): the vehicle's orders + order prices + totals. */
export function useVehicleLedger(id: string, params: { date_from?: string; date_to?: string } = {}, opts: { enabled?: boolean } = {}) {
  return useQuery<VehicleLedger>({
    queryKey: queryKeys.vehicleLedger.detail(id, params),
    queryFn: async () => {
      console.log(`🔄 useVehicleLedger: Fetching ${id}`);
      const res = await getVehicleLedger(id, params);
      console.log(`✅ useVehicleLedger: ${res.orders.length} orders`);
      return res;
    },
    enabled: (opts.enabled ?? true) && Boolean(id),
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: true,
  });
}
