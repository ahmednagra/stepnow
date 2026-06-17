// src/hooks/queries/useLegalPages.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import {
  getAdminLegalPage,
  listAdminLegalPages,
  listAdminLegalPageVersions,
} from "@/services/legalPages/legalPages.admin.client";
import type { LegalPageAdmin, LegalPageVersionAdmin } from "@/types";

/** All legal pages. */
export function useLegalPages(opts: { enabled?: boolean } = {}) {
  return useQuery<{ items: LegalPageAdmin[] }>({
    queryKey: queryKeys.legalPages.lists(),
    queryFn: async () => {
      console.log(`🔄 useLegalPages: Fetching legal pages`);
      const res = await listAdminLegalPages();
      console.log(`✅ useLegalPages: Fetched ${res.items.length}`);
      return res;
    },
    enabled: opts.enabled ?? true,
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
  });
}

/** Single legal page by slug. */
export function useLegalPage(slug: string, opts: { enabled?: boolean } = {}) {
  return useQuery<LegalPageAdmin>({
    queryKey: queryKeys.legalPages.detail(slug),
    queryFn: async () => {
      console.log(`🔄 useLegalPage: Fetching ${slug}`);
      const p = await getAdminLegalPage(slug);
      console.log(`✅ useLegalPage: Fetched ${slug}`);
      return p;
    },
    enabled: (opts.enabled ?? true) && Boolean(slug),
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
  });
}

/** Version history for a legal page. */
export function useLegalPageVersions(slug: string, opts: { enabled?: boolean } = {}) {
  return useQuery<{ items: LegalPageVersionAdmin[] }>({
    queryKey: queryKeys.legalPages.versions(slug),
    queryFn: async () => {
      console.log(`🔄 useLegalPageVersions: Fetching ${slug}`);
      const res = await listAdminLegalPageVersions(slug);
      console.log(`✅ useLegalPageVersions: Fetched ${res.items.length}`);
      return res;
    },
    enabled: (opts.enabled ?? true) && Boolean(slug),
    staleTime: STALE_TIMES.STATIC,
    gcTime: GC_TIMES.LONG,
    refetchOnWindowFocus: false,
  });
}
