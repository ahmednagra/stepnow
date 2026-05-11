// src/types/audit-log.ts
import type { Pagination } from "./api";

export interface AuditLogEntry {
  id: number;
  created_at: string;
  actor_id: string | null;
  actor_email: string | null;
  table_name: string;
  record_id: string;
  action: string;
  changes: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  notes: string | null;
}

export interface PaginatedAuditLog {
  items: AuditLogEntry[];
  pagination: Pagination;
}
