// src/app/api/v0/admin/invoices/[id]/issue/route.ts
// BFF: issue a draft bill (§14 checks + frozen PDF happen server-side). Forwards to
// FastAPI /admin/invoices/{id}/issue.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { issueInvoiceServer } from "@/services/orders/orders.admin.server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  try {
    return NextResponse.json(await issueInvoiceServer(params.id, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
