// src/app/api/v0/admin/notifications/unread-count/route.ts
// BFF handler for the unread badge count. Forwards to FastAPI /admin/notifications/unread-count.

import { bffHandler } from "@/lib/bff-helpers";
import { adminGet } from "@/lib/admin-bff";
import type { UnreadCount } from "@/services/notifications";

export async function GET() {
  return bffHandler(() => adminGet<UnreadCount>("/admin/notifications/unread-count"));
}
