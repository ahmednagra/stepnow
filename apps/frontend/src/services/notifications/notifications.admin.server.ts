// apps/frontend/src/services/notifications/notifications.admin.server.ts
// Admin notifications server service (BFF → FastAPI with bearer auth). Mutations bust public ISR tags.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { revalidateForPath } from "@/lib/revalidate";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated } from "@/types";
import type { NotificationItem, UnreadCount } from "./notifications.admin.client";

function unwrap<T>(result: ApiResponse<T>): T {
  if (result.error || result.data === undefined) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "Request failed",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}

export async function listAdminNotificationsServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<Paginated<NotificationItem>> {
  return unwrap(await serverApiClient.get<Paginated<NotificationItem>>(ENDPOINTS.ADMIN.NOTIFICATIONS, { params }, authToken));
}

export async function getAdminUnreadCountServer(authToken: string): Promise<UnreadCount> {
  return unwrap(await serverApiClient.get<UnreadCount>(ENDPOINTS.ADMIN.NOTIFICATIONS_UNREAD_COUNT, undefined, authToken));
}

export async function markAdminNotificationsReadServer(data: Record<string, unknown>, authToken: string): Promise<UnreadCount> {
  const c = unwrap(await serverApiClient.post<UnreadCount>(ENDPOINTS.ADMIN.NOTIFICATIONS_READ, data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.NOTIFICATIONS);
  return c;
}

export async function markAllAdminNotificationsReadServer(authToken: string): Promise<UnreadCount> {
  const c = unwrap(await serverApiClient.post<UnreadCount>(ENDPOINTS.ADMIN.NOTIFICATIONS_READ_ALL, undefined, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.NOTIFICATIONS);
  return c;
}

export async function archiveAdminNotificationServer(id: string, authToken: string): Promise<void> {
  const r = await serverApiClient.post<void>(ENDPOINTS.ADMIN.NOTIFICATION_ARCHIVE(id), undefined, undefined, authToken);
  if (r.error) throw new ApiError(r.error.code, r.error.message, r.status, r.error.extra);
  revalidateForPath(ENDPOINTS.ADMIN.NOTIFICATIONS);
}
