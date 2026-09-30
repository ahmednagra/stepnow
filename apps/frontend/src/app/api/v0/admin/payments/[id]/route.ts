// src/app/api/v0/admin/payments/[id]/route.ts
// BFF: change a payment's status (refund / confirm a pending one). Forwards to FastAPI
// PATCH /admin/payments/{id}.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { setPaymentStatusServer } from "@/services/orders/orders.admin.server";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Empty body", 400);
  try {
    return NextResponse.json(await setPaymentStatusServer(params.id, body, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
