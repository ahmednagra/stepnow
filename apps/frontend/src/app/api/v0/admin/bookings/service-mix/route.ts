// apps/frontend/src/app/api/v0/admin/bookings/service-mix/route.ts
// BFF handler for service mix. Forwards to FastAPI /admin/bookings/service-mix with bearer auth.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { getAdminBookingsServiceMixServer } from "@/services/bookings/bookings.admin.server";

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const from_date = request.nextUrl.searchParams.get("from_date");
  const to_date = request.nextUrl.searchParams.get("to_date");
  if (!from_date || !to_date) return errorResponse("BAD_REQUEST", "from_date and to_date are required", 400);
  try {
    return NextResponse.json(await getAdminBookingsServiceMixServer({ from_date, to_date }, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
