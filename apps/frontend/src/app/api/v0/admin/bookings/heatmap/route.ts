// apps/frontend/src/app/api/v0/admin/bookings/heatmap/route.ts
// BFF handler for the bookings heatmap aggregation endpoint.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { getAdminBookingsHeatmapServer } from "@/services/bookings/bookings.admin.server";

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  try {
    return NextResponse.json(await getAdminBookingsHeatmapServer(token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
