// src/lib/react-query/index.ts
// Barrel for the React Query layer. Also exposes a single makeQueryClient() used by the
// provider so client config lives in one place.

import { QueryClient } from "@tanstack/react-query";
import { STALE_TIMES, GC_TIMES } from "./config";

export { STALE_TIMES, GC_TIMES } from "./config";
export { queryKeys } from "./query-keys";

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIMES.STANDARD,
        gcTime: GC_TIMES.STANDARD,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
