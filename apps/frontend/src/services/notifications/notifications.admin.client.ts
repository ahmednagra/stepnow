// src/services/notifications/notifications.admin.client.ts
// Admin client for the notification panel. Mirrors orders.admin.client.ts (nextjsApiClient,
// self-contained types). Browser → /api/v0 BFF → backend /admin/notifications*.

import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Paginated } from "@/types";

export interface NotificationItem {
  id: string;
  recipient_id: string;
  type: string;
  category: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  is_archived: boolean;
  notification_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UnreadCount {
  unread: number;
}

export interface ListNotificationsParams {
  page?: number;
  size?: number;
  unreadOnly?: boolean;
}

export async function listNotifications(
  params: ListNotificationsParams = {},
): Promise<Paginated<NotificationItem>> {
  const query: Record<string, string | number | boolean> = {};
  if (params.page) query.page = params.page;
  if (params.size) query.size = params.size;
  if (params.unreadOnly) query.unread_only = true;
  return nextjsApiClient.get<Paginated<NotificationItem>>("/admin/notifications", { params: query });
}

export async function getUnreadCount(): Promise<UnreadCount> {
  return nextjsApiClient.get<UnreadCount>("/admin/notifications/unread-count");
}

export async function markNotificationsRead(ids: string[]): Promise<UnreadCount> {
  return nextjsApiClient.post<UnreadCount>("/admin/notifications/read", { ids });
}

export async function markAllNotificationsRead(): Promise<UnreadCount> {
  return nextjsApiClient.post<UnreadCount>("/admin/notifications/read-all");
}

export async function archiveNotification(id: string): Promise<void> {
  await nextjsApiClient.post<void>(`/admin/notifications/${id}/archive`);
}
