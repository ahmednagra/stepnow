// src/services/auditLog/auditLog.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { AuditLogEntry, PaginatedAuditLog } from "@/types";

export interface ListAuditLogParams {
  page?: number;
  size?: number;
  table_name?: string;
  action?: string;
  actor_email?: string;
  record_id?: string;
  from_date?: string;
  to_date?: string;
}

export async function listAuditLog(params: ListAuditLogParams = {}): Promise<PaginatedAuditLog> {
  return nextjsApiClient.get<PaginatedAuditLog>(ENDPOINTS.ADMIN.AUDIT_LOG, {
    params: { ...params },
  });
}

export async function getAuditLogEntry(id: number): Promise<AuditLogEntry> {
  return nextjsApiClient.get<AuditLogEntry>(ENDPOINTS.ADMIN.AUDIT_LOG_BY_ID(String(id)));
}
