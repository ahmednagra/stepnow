// src/app/api/v0/admin/orders/[id]/delivery-status/route.ts
// BFF handler to advance the manual delivery lifecycle (draft → dispatched → picked_up → delivered).
// Forwards to FastAPI POST /admin/orders/{id}/delivery-status with bearer auth.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { setAdminOrderDeliveryStatusServer } from "@/services/orders/orders.admin.server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Empty body", 400);
  try {
    return NextResponse.json(await setAdminOrderDeliveryStatusServer(params.id, body, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
