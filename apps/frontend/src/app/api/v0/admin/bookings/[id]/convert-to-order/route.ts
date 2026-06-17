// src/app/api/v0/admin/bookings/[id]/convert-to-order/route.ts
// BFF handler to convert a booking into an order.
// Forwards to FastAPI POST /admin/bookings/{id}/convert-to-order with bearer auth.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { convertBookingToOrderServer } from "@/services/bookings/bookings.admin.server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Empty body", 400);
  try {
    return NextResponse.json(await convertBookingToOrderServer(params.id, body, token), { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
