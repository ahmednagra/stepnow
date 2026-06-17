// src/hooks/queries/useSidebarCounts.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { nextjsApiClient } from "@/lib/nextjs-api";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import { ENDPOINTS } from "@/services/api/endpoints";

interface SidebarCounts {
  bookings: number;
  messages: number;
}
interface CountResponse {
  pagination: { total: number };
}

/** Sidebar badge counts (new bookings + unhandled messages). */
export function useSidebarCounts() {
  return useQuery<SidebarCounts>({
    queryKey: queryKeys.sidebar.counts(),
    queryFn: async () => {
      console.log(`🔄 useSidebarCounts: Fetching counts`);
      const [bk, mg] = await Promise.all([
        nextjsApiClient.get<CountResponse>(ENDPOINTS.ADMIN.BOOKINGS, { params: { status: "new", size: 1 } }),
        nextjsApiClient.get<CountResponse>(ENDPOINTS.ADMIN.CONTACT_MESSAGES, { params: { is_handled: false, size: 1 } }),
      ]);
      const counts = { bookings: bk.pagination?.total ?? 0, messages: mg.pagination?.total ?? 0 };
      console.log(`✅ useSidebarCounts: bookings=${counts.bookings} messages=${counts.messages}`);
      return counts;
    },
    staleTime: STALE_TIMES.STANDARD,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: true,
  });
}
