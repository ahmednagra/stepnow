// src/hooks/queries/useFaqs.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import { getAdminFaq, listAdminFaqs } from "@/services/faqs/faqs.admin.client";
import type { Paginated, FaqAdmin } from "@/types";

/** Paginated FAQs list. */
export function useFaqs(
  params: { q?: string; include_deleted?: boolean; page?: number; size?: number } = {},
  opts: { enabled?: boolean } = {},
) {
  return useQuery<Paginated<FaqAdmin>>({
    queryKey: queryKeys.faqs.list(params),
    queryFn: async () => {
      console.log(`🔄 useFaqs: Fetching faqs`);
      const res = await listAdminFaqs(params);
      console.log(`✅ useFaqs: Fetched ${res.items.length} faqs`);
      return res;
    },
    enabled: opts.enabled ?? true,
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/** Single FAQ by id. */
export function useFaq(id: string, opts: { enabled?: boolean } = {}) {
  return useQuery<FaqAdmin>({
    queryKey: queryKeys.faqs.detail(id),
    queryFn: async () => {
      console.log(`🔄 useFaq: Fetching ${id}`);
      const f = await getAdminFaq(id);
      console.log(`✅ useFaq: Fetched ${id}`);
      return f;
    },
    enabled: (opts.enabled ?? true) && Boolean(id),
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
  });
}
