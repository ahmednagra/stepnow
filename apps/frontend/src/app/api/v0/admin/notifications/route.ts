// src/app/api/v0/admin/notifications/route.ts
// BFF handler for the notification inbox list. Forwards to FastAPI /admin/notifications.

import type { NextRequest } from "next/server";
import { bffHandler } from "@/lib/bff-helpers";
import { adminGet } from "@/lib/admin-bff";
import type { Paginated } from "@/types";
import type { NotificationItem } from "@/services/notifications";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number | boolean> = {};
  const page = sp.get("page");
  const size = sp.get("size");
  const unreadOnly = sp.get("unread_only");
  if (page) params.page = Number(page);
  if (size) params.size = Number(size);
  if (unreadOnly === "true") params.unread_only = true;
  return bffHandler(() => adminGet<Paginated<NotificationItem>>("/admin/notifications", params));
}
