// src/app/api/v0/public/orders/route.ts
// Public (no-auth) worker order creation. Gated server-side by the shared staff code; full
// validation is on FastAPI. Rate-limited upstream.

import { NextResponse, type NextRequest } from "next/server";
import { serverApiClient } from "@/lib/server-api";
import { apiErrorResponse, errorResponse, parseJsonBody } from "@/lib/bff-helpers";
import { ApiError } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Empty body", 400);
  try {
    const r = await serverApiClient.post(ENDPOINTS.PUBLIC.ORDERS, body);
    if (r.error) throw new ApiError(r.error.code, r.error.message, r.status, r.error.extra);
    return NextResponse.json(r.data, { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
