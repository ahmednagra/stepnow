// src/hooks/queries/useAuditLog.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import { listAuditLog } from "@/services/auditLog/auditLog.client";
import type { PaginatedAuditLog } from "@/types";

/** Paginated, filterable audit log (historical — no focus refetch). */
export function useAuditLog(
  params: { q?: string; page?: number; size?: number; [k: string]: unknown } = {},
  opts: { enabled?: boolean } = {},
) {
  return useQuery<PaginatedAuditLog>({
    queryKey: queryKeys.auditLog.list(params),
    queryFn: async () => {
      console.log(`🔄 useAuditLog: Fetching audit log`);
      const res = await listAuditLog(params);
      console.log(`✅ useAuditLog: Fetched ${res.items.length} entries`);
      return res;
    },
    enabled: opts.enabled ?? true,
    staleTime: STALE_TIMES.STANDARD,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: false,
  });
}
