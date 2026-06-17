// src/app/api/v0/admin/notifications/unread-count/route.ts
// BFF handler for the unread badge count. Forwards to FastAPI /admin/notifications/unread-count.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { getAdminUnreadCountServer } from "@/services/notifications/notifications.admin.server";

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  try {
    return NextResponse.json(await getAdminUnreadCountServer(token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
