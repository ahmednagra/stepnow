// src/lib/react-query/config.ts
// Freshness tiers for React Query. Orders are operational data (changes often, must feel live),
// so they use the DYNAMIC tier — short stale time, refetch on focus — while realtime events from
// the WebSocket keep the cache patched between refetches. Reference/lookup data uses STATIC.

export const STALE_TIMES = {
  /** Operational data that changes constantly (orders, payments). */
  DYNAMIC: 15_000, // 15s
  /** Data that changes occasionally within a session. */
  STANDARD: 60_000, // 1m
  /** Long-lived reference data (statuses, services, lookups). */
  STATIC: 30 * 60_000, // 30m
} as const;

export const GC_TIMES = {
  SHORT: 60_000, // 1m
  STANDARD: 5 * 60_000, // 5m
  LONG: 60 * 60_000, // 1h
} as const;
