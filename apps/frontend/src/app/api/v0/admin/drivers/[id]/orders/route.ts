// src/app/api/v0/admin/drivers/[id]/orders/route.ts
// BFF handler for a driver's job history (used by the driver detail page).
// Forwards to FastAPI /admin/drivers/{id}/orders.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { listDriverOrdersServer } from "@/services/drivers/drivers.admin.server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  try {
    return NextResponse.json(await listDriverOrdersServer(params.id, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
