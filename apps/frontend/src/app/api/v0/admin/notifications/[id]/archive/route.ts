// src/app/api/v0/admin/notifications/[id]/archive/route.ts
// BFF handler to archive one notification. Forwards to FastAPI POST /admin/notifications/{id}/archive.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { archiveAdminNotificationServer } from "@/services/notifications/notifications.admin.server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  try {
    await archiveAdminNotificationServer(params.id, token);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
