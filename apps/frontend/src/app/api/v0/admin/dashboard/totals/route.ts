// apps/frontend/src/app/api/v0/admin/dashboard/totals/route.ts
// BFF handler for the dashboard totals aggregation endpoint.

import { bffHandler } from "@/lib/bff-helpers";
import { adminGet } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { DashboardTotalsResponse } from "@/services/admin-dashboard";

export async function GET() {
return bffHandler(() => adminGet<DashboardTotalsResponse>(ENDPOINTS.ADMIN.DASHBOARD_TOTALS));
}
