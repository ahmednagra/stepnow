// src/hooks/queries/useServices.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import {
  getAdminService,
  listAdminServices,
  type ListAdminServicesParams,
} from "@/services/services/services.admin.client";
import { listAdminPricingCategories } from "@/services/pricing/pricing.admin.client";
import type { Paginated, ServiceAdmin, PricingCategoryAdmin } from "@/types";

/** Paginated services list. */
export function useServices(params: ListAdminServicesParams = {}, opts: { enabled?: boolean } = {}) {
  return useQuery<Paginated<ServiceAdmin>>({
    queryKey: queryKeys.services.list(params as Record<string, unknown>),
    queryFn: async () => {
      console.log(`🔄 useServices: Fetching services`);
      const res = await listAdminServices(params);
      console.log(`✅ useServices: Fetched ${res.items.length} services`);
      return res;
    },
    enabled: opts.enabled ?? true,
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
  });
}

/** Single service by id. */
export function useService(id: string, opts: { enabled?: boolean } = {}) {
  return useQuery<ServiceAdmin>({
    queryKey: queryKeys.services.detail(id),
    queryFn: async () => {
      console.log(`🔄 useService: Fetching ${id}`);
      const s = await getAdminService(id);
      console.log(`✅ useService: Fetched ${id}`);
      return s;
    },
    enabled: (opts.enabled ?? true) && Boolean(id),
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
  });
}

/** Pricing categories for a service. */
export function useServicePricingCategories(serviceId: string, opts: { enabled?: boolean } = {}) {
  return useQuery<PricingCategoryAdmin[]>({
    queryKey: queryKeys.services.pricingCategories(serviceId),
    queryFn: async () => {
      console.log(`🔄 useServicePricingCategories: Fetching ${serviceId}`);
      const cats = await listAdminPricingCategories(serviceId);
      console.log(`✅ useServicePricingCategories: Fetched ${cats.length}`);
      return cats;
    },
    enabled: (opts.enabled ?? true) && Boolean(serviceId),
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
  });
}
