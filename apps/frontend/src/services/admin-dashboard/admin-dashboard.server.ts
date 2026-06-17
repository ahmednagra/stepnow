// apps/frontend/src/services/admin-dashboard/admin-dashboard.server.ts
// Admin dashboard server service (BFF → FastAPI with bearer auth). GET-only, no revalidation.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { DashboardTotalsResponse } from "@/services/admin-dashboard";

function unwrap<T>(result: ApiResponse<T>): T {
  if (result.error || result.data === undefined) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "Request failed",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}

export async function getDashboardTotalsServer(authToken: string): Promise<DashboardTotalsResponse> {
  return unwrap(await serverApiClient.get<DashboardTotalsResponse>(ENDPOINTS.ADMIN.DASHBOARD_TOTALS, undefined, authToken));
}
