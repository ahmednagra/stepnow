// src/app/api/v0/admin/notifications/read/route.ts
// BFF handler to mark specific notifications read. Forwards to FastAPI POST /admin/notifications/read.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { markAdminNotificationsReadServer } from "@/services/notifications/notifications.admin.server";

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Empty body", 400);
  try {
    return NextResponse.json(await markAdminNotificationsReadServer(body, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
