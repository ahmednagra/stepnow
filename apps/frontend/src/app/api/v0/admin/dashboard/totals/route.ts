// apps/frontend/src/app/api/v0/admin/dashboard/totals/route.ts
// BFF handler for the dashboard totals aggregation endpoint.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { getDashboardTotalsServer } from "@/services/admin-dashboard/admin-dashboard.server";

export async function GET(request: NextRequest) {
	const token = extractBearerToken(request);
	if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
	try {
		return NextResponse.json(await getDashboardTotalsServer(token));
	} catch (err) {
		return apiErrorResponse(err);
	}
}
