// apps/frontend/src/app/api/v0/admin/bookings/upcoming/route.ts
// BFF handler for the upcoming-bookings list endpoint.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { getAdminBookingsUpcomingServer } from "@/services/bookings/bookings.admin.server";

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const limit = request.nextUrl.searchParams.get("limit") ?? "4";
  try {
    return NextResponse.json(await getAdminBookingsUpcomingServer({ limit }, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
