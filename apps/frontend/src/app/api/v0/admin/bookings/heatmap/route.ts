// apps/frontend/src/app/api/v0/admin/bookings/heatmap/route.ts
// BFF handler for the bookings heatmap aggregation endpoint.

import { bffHandler } from "@/lib/bff-helpers";
import { adminGet } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { BookingsHeatmapResponse } from "@/services/admin-dashboard";

export async function GET() {
return bffHandler(() => adminGet<BookingsHeatmapResponse>(ENDPOINTS.ADMIN.BOOKINGS_HEATMAP));
}
