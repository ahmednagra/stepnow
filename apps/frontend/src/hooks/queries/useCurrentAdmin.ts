// src/hooks/queries/useCurrentAdmin.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import { fetchCurrentAdmin } from "@/services/auth/auth.client";
import { getAccessToken } from "@/lib/auth-storage";
import type { CurrentAdmin } from "@/types";

/** Current admin from /auth/me. Disabled when no token is stored; never retried on 401. */
export function useCurrentAdmin() {
  return useQuery<CurrentAdmin>({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      console.log(`🔄 useCurrentAdmin: Fetching /auth/me`);
      const admin = await fetchCurrentAdmin();
      console.log(`✅ useCurrentAdmin: ${admin.email}`);
      return admin;
    },
    enabled: Boolean(getAccessToken()),
    staleTime: STALE_TIMES.STANDARD,
    gcTime: GC_TIMES.STANDARD,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
