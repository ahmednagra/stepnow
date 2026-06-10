// src/app/api/v0/admin/notifications/read/route.ts
// BFF handler to mark specific notifications read. Forwards to FastAPI POST /admin/notifications/read.

import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminPost } from "@/lib/admin-bff";
import type { UnreadCount } from "@/services/notifications";

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() => adminPost<UnreadCount>("/admin/notifications/read", body));
}
