// src/app/api/v0/admin/customers/[id]/orders/route.ts
// BFF handler for a customer's order history (used by the customer detail page).
// Forwards to FastAPI /admin/customers/{id}/orders.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { listCustomerOrdersServer } from "@/services/customers/customers.admin.server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  try {
    return NextResponse.json(await listCustomerOrdersServer(params.id, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
