// src/app/api/v0/admin/notifications/route.ts
// BFF handler for the notification inbox list. Forwards to FastAPI /admin/notifications.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { listAdminNotificationsServer } from "@/services/notifications/notifications.admin.server";

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number | boolean> = {};
  if (sp.get("page")) params.page = Number(sp.get("page"));
  if (sp.get("size")) params.size = Number(sp.get("size"));
  if (sp.get("unread_only") === "true") params.unread_only = true;
  try {
    return NextResponse.json(await listAdminNotificationsServer(params, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
