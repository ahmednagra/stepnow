// src/app/api/v0/admin/orders/route.ts
// BFF handler for the orders list. Forwards to FastAPI /admin/orders with bearer auth.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { listAdminOrdersServer } from "@/services/orders/orders.admin.server";

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number | boolean> = {};
  if (sp.get("page")) params.page = Number(sp.get("page"));
  if (sp.get("size")) params.size = Number(sp.get("size"));
  if (sp.get("status")) params.status = sp.get("status")!;
  if (sp.get("q")) params.q = sp.get("q")!;
  if (sp.get("include_deleted") === "true") params.include_deleted = true;
  try {
    return NextResponse.json(await listAdminOrdersServer(params, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
