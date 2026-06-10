// src/hooks/queries/useNotifications.ts
// React Query READ hooks for the admin notification panel. No WebSocket — the unread badge is
// kept fresh by a light refetch interval (poll). Fetching goes through the notifications client
// service (browser → /api/v0 BFF → backend /admin/notifications*).

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import {
  listNotifications,
  getUnreadCount,
  type NotificationItem,
  type UnreadCount,
} from "@/services/notifications";
import type { Paginated } from "@/types";

interface QueryOptions {
  enabled?: boolean;
}

/** Paginated notification inbox. */
export function useNotifications(
  params: { page?: number; size?: number; unreadOnly?: boolean } = {},
  options: QueryOptions = {},
) {
  return useQuery<Paginated<NotificationItem>>({
    queryKey: queryKeys.notifications.list(params.unreadOnly),
    queryFn: () => listNotifications(params),
    enabled: options.enabled ?? true,
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.SHORT,
    refetchOnWindowFocus: true,
  });
}

/** Unread count for the bell badge. Polled every 60s. */
export function useUnreadNotificationCount(options: QueryOptions = {}) {
  return useQuery<UnreadCount>({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: getUnreadCount,
    enabled: options.enabled ?? true,
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.SHORT,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
}
