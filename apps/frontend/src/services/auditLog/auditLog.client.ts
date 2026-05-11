// src/services/auditLog/auditLog.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { AuditLogEntry, PaginatedAuditLog } from "@/types";

export interface ListAuditLogParams {
  page?: number;
  size?: number;
  table_name?: string;
  action?: string;
  actor_email?: string;
}

export async function listAuditLog(params: ListAuditLogParams = {}): Promise<PaginatedAuditLog> {
  return nextjsApiClient.get<PaginatedAuditLog>("/admin/audit-log", {
    params: { ...params },
  });
}

export async function getAuditLogEntry(id: number): Promise<AuditLogEntry> {
  return nextjsApiClient.get<AuditLogEntry>(`/admin/audit-log/${id}`);
}
