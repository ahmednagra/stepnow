// src/services/auditLog/auditLog.server.ts
// Admin audit-log server service (BFF → FastAPI with bearer auth). GET-only, no revalidation.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { PaginatedAuditLog } from "@/types";

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

export async function listAuditLogServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<PaginatedAuditLog> {
  return unwrap(await serverApiClient.get<PaginatedAuditLog>(ENDPOINTS.ADMIN.AUDIT_LOG, { params }, authToken));
}
