// apps/frontend/src/app/api/v0/admin/bookings/upcoming/route.ts
// BFF handler for the upcoming-bookings list endpoint.

import type { NextRequest } from "next/server";
import { bffHandler, getParam } from "@/lib/bff-helpers";
import { adminGet } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { UpcomingBookingsResponse } from "@/services/admin-dashboard";

export async function GET(request: NextRequest) {
const limit = getParam(request, "limit") ?? "4";
return bffHandler(() => adminGet<UpcomingBookingsResponse>(ENDPOINTS.ADMIN.BOOKINGS_UPCOMING, { limit }));
}
