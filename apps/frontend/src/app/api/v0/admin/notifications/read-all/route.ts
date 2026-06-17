// src/app/api/v0/admin/notifications/read-all/route.ts
// BFF handler to mark all notifications read. Forwards to FastAPI POST /admin/notifications/read-all.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { markAllAdminNotificationsReadServer } from "@/services/notifications/notifications.admin.server";

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  try {
    return NextResponse.json(await markAllAdminNotificationsReadServer(token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
