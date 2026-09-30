// src/app/api/v0/admin/invoices/[id]/cancel/route.ts
// BFF: cancel (Storno) an issued bill. Forwards to FastAPI /admin/invoices/{id}/cancel.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { cancelInvoiceServer } from "@/services/orders/orders.admin.server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = (await parseJsonBody<Record<string, unknown>>(request)) ?? {};
  try {
    return NextResponse.json(await cancelInvoiceServer(params.id, body, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
