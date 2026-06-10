// src/app/api/v0/admin/notifications/read-all/route.ts
// BFF handler to mark all notifications read. Forwards to FastAPI POST /admin/notifications/read-all.

import { bffHandler } from "@/lib/bff-helpers";
import { adminPost } from "@/lib/admin-bff";
import type { UnreadCount } from "@/services/notifications";

export async function POST() {
  return bffHandler(() => adminPost<UnreadCount>("/admin/notifications/read-all"));
}
