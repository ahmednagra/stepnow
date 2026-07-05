// src/app/api/v0/public/staff-gate/route.ts
// Public (no-auth) check of the shared staff code before showing the create-order form.

import { NextResponse, type NextRequest } from "next/server";
import { serverApiClient } from "@/lib/server-api";
import { apiErrorResponse, errorResponse, parseJsonBody } from "@/lib/bff-helpers";
import { ApiError } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<{ code: string }>(request);
  if (!body?.code) return errorResponse("BAD_REQUEST", "Code is required", 400);
  try {
    const r = await serverApiClient.post(ENDPOINTS.PUBLIC.STAFF_GATE, body);
    if (r.error) throw new ApiError(r.error.code, r.error.message, r.status, r.error.extra);
    return NextResponse.json(r.data);
  } catch (err) {
    return apiErrorResponse(err);
  }
}
