// apps/frontend/src/app/api/v0/admin/bookings/service-mix/route.ts
// BFF handler for service mix. Forwards to FastAPI /admin/bookings/service-mix with bearer auth.

import type { NextRequest } from "next/server";
import { bffHandler, errorResponse } from "@/lib/bff-helpers";
import { adminGet } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { ServiceMixResponse } from "@/services/admin-stats";

export async function GET(request: NextRequest) {
const from_date = request.nextUrl.searchParams.get("from_date");
const to_date = request.nextUrl.searchParams.get("to_date");
if (!from_date || !to_date) return errorResponse("BAD_REQUEST", "from_date and to_date are required", 400);
return bffHandler(() => adminGet<ServiceMixResponse>(ENDPOINTS.ADMIN.BOOKINGS_SERVICE_MIX, { from_date, to_date }));
}
