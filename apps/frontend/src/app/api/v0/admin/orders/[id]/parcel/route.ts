// src/app/api/v0/admin/orders/[id]/parcel/route.ts
// BFF handler to update an order's parcel/courier fields.
// Forwards to FastAPI PATCH /admin/orders/{id}/parcel with bearer auth.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { updateAdminOrderParcelServer } from "@/services/orders/orders.admin.server";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Empty body", 400);
  try {
    return NextResponse.json(await updateAdminOrderParcelServer(params.id, body, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
