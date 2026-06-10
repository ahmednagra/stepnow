// src/hooks/mutations/useNotificationMutations.ts
// React Query WRITE hooks for the notification panel. Each invalidates the list + unread count
// so the bell badge and inbox stay consistent.

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  markNotificationsRead,
  markAllNotificationsRead,
  archiveNotification,
} from "@/services/notifications";

function useInvalidateNotifications() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
    void qc.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
  };
}

export function useMarkNotificationsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (ids: string[]) => markNotificationsRead(ids),
    onSuccess: invalidate,
  });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: invalidate,
  });
}

export function useArchiveNotification() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id: string) => archiveNotification(id),
    onSuccess: invalidate,
  });
}
