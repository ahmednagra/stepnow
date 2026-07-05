// src/app/api/v0/admin/invoices/[id]/route.ts
// BFF: fetch + edit a bill. Forwards to FastAPI /admin/invoices/{id}.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { getInvoiceServer, updateInvoiceServer } from "@/services/orders/orders.admin.server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  try {
    return NextResponse.json(await getInvoiceServer(params.id, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = (await parseJsonBody<Record<string, unknown>>(request)) ?? {};
  try {
    return NextResponse.json(await updateInvoiceServer(params.id, body, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
