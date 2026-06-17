// src/app/api/v0/admin/orders/[id]/invoice/route.ts
// BFF handler to create an invoice from an order. Forwards to FastAPI
// POST /admin/orders/{id}/invoice with bearer auth.
// NOTE: the invoice *PDF* stream lives at /admin/orders/{id}/invoice/pdf and is
// fetched directly (authenticated FileResponse), not through this JSON handler.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { createAdminOrderInvoiceServer } from "@/services/orders/orders.admin.server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = (await parseJsonBody<Record<string, unknown>>(request)) ?? {};
  try {
    return NextResponse.json(await createAdminOrderInvoiceServer(params.id, body, token), { status: 201 });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
