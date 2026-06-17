// src/hooks/queries/useTestimonials.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import {
  getAdminTestimonial,
  listAdminTestimonials,
  type ListAdminTestimonialsParams,
} from "@/services/testimonials/testimonials.admin.client";
import type { Paginated, TestimonialAdmin } from "@/types";

/** Paginated testimonials list. */
export function useTestimonials(params: ListAdminTestimonialsParams = {}, opts: { enabled?: boolean } = {}) {
  return useQuery<Paginated<TestimonialAdmin>>({
    queryKey: queryKeys.testimonials.list(params as Record<string, unknown>),
    queryFn: async () => {
      console.log(`🔄 useTestimonials: Fetching testimonials`);
      const res = await listAdminTestimonials(params);
      console.log(`✅ useTestimonials: Fetched ${res.items.length} testimonials`);
      return res;
    },
    enabled: opts.enabled ?? true,
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/** Single testimonial by id. */
export function useTestimonial(id: string, opts: { enabled?: boolean } = {}) {
  return useQuery<TestimonialAdmin>({
    queryKey: queryKeys.testimonials.detail(id),
    queryFn: async () => {
      console.log(`🔄 useTestimonial: Fetching ${id}`);
      const t = await getAdminTestimonial(id);
      console.log(`✅ useTestimonial: Fetched ${id}`);
      return t;
    },
    enabled: (opts.enabled ?? true) && Boolean(id),
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
  });
}
