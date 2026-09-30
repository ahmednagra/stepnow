// src/hooks/queries/useNotifications.ts
// React Query READ hooks for the admin notification panel. The admin realtime socket invalidates
// these on `notification.created`; the unread badge also polls as a fallback — every 60s while the
// socket is down, every 5 min while it is up (safety net for a missed event). Fetching goes through
// the notifications client service (browser → /api/v0 BFF → backend /admin/notifications*).

"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import { useRealtimeConnected } from "@/hooks/realtime/AdminRealtimeProvider";
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
    queryFn: async () => {
      console.log(`🔄 useNotifications: Fetching notifications`);
      const res = await listNotifications(params);
      console.log(`✅ useNotifications: Fetched ${res.items.length} notifications`);
      return res;
    },
    enabled: options.enabled ?? true,
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.SHORT,
    refetchOnWindowFocus: true,
  });
}

/** Unread count for the bell badge. Pushed by the socket; polled 60s without it, 5 min with it. */
export function useUnreadNotificationCount(options: QueryOptions = {}) {
  const realtime = useRealtimeConnected();
  return useQuery<UnreadCount>({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      console.log(`🔄 useUnreadNotificationCount: Fetching unread count`);
      const res = await getUnreadCount();
      console.log(`✅ useUnreadNotificationCount: Fetched`);
      return res;
    },
    enabled: options.enabled ?? true,
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.SHORT,
    refetchOnWindowFocus: true,
    refetchInterval: realtime ? 5 * 60_000 : 60_000,
  });
}
