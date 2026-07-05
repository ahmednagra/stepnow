// src/app/api/v0/admin/vehicles/[id]/ledger/route.ts
// BFF: per-vehicle account (ledger). Forwards to FastAPI /admin/vehicles/{id}/ledger.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { getVehicleLedgerServer } from "@/services/vehicles/vehicles.admin.server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const sp = request.nextUrl.searchParams;
  const q: Record<string, string> = {};
  if (sp.get("date_from")) q.date_from = sp.get("date_from")!;
  if (sp.get("date_to")) q.date_to = sp.get("date_to")!;
  try {
    return NextResponse.json(await getVehicleLedgerServer(params.id, q, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
