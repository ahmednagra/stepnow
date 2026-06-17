// src/app/api/v0/admin/orders/[id]/payments/route.ts
// BFF handler for an order's payments ledger. Forwards to FastAPI
// /admin/orders/{id}/payments with bearer auth.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import {
  listAdminOrderPaymentsServer,
  recordAdminOrderPaymentServer,
} from "@/services/orders/orders.admin.server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  try {
    return NextResponse.json(await listAdminOrderPaymentsServer(params.id, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Empty body", 400);
  try {
    return NextResponse.json(await recordAdminOrderPaymentServer(params.id, body, token), { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
