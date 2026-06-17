// src/app/api/v0/admin/orders/[id]/send/route.ts
// BFF handler to email the driver slip (and optionally the invoice to the customer).
// Forwards to FastAPI POST /admin/orders/{id}/send with bearer auth.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { sendAdminOrderServer } from "@/services/orders/orders.admin.server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Empty body", 400);
  try {
    return NextResponse.json(await sendAdminOrderServer(params.id, body, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
