// src/hooks/queries/useUiStrings.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import { listAdminUiStrings } from "@/services/uiStrings/uiStrings.admin.client";
import type { Paginated, UiStringAdmin } from "@/types";

/** Paginated, filterable UI strings (content — long-lived cache). */
export function useUiStrings(
  params: { q?: string; namespace?: string; page?: number; size?: number } = {},
  opts: { enabled?: boolean } = {},
) {
  return useQuery<Paginated<UiStringAdmin>>({
    queryKey: queryKeys.uiStrings.list(params),
    queryFn: async () => {
      console.log(`🔄 useUiStrings: Fetching UI strings`);
      const res = await listAdminUiStrings(params);
      console.log(`✅ useUiStrings: Fetched ${res.items.length} strings`);
      return res;
    },
    enabled: opts.enabled ?? true,
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
