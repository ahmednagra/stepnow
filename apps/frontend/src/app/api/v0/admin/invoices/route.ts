// src/app/api/v0/admin/invoices/route.ts
// BFF: bills (invoices) list. Forwards to FastAPI /admin/invoices with bearer auth.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { listInvoicesServer } from "@/services/orders/orders.admin.server";

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number> = {};
  if (sp.get("page")) params.page = Number(sp.get("page"));
  if (sp.get("size")) params.size = Number(sp.get("size"));
  if (sp.get("status")) params.status = sp.get("status")!;
  if (sp.get("q")) params.q = sp.get("q")!;
  try {
    return NextResponse.json(await listInvoicesServer(params, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
