// src/app/api/v0/admin/audit-log/route.ts
import type { NextRequest } from "next/server";
import { bffHandler } from "@/lib/bff-helpers";
import { adminGet } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { PaginatedAuditLog } from "@/types";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number> = {};
  const page = sp.get("page");
  const size = sp.get("size");
  const tableName = sp.get("table_name");
  const action = sp.get("action");
  const actorEmail = sp.get("actor_email");
  if (page) params.page = Number(page);
  if (size) params.size = Number(size);
  if (tableName) params.table_name = tableName;
  if (action) params.action = action;
  if (actorEmail) params.actor_email = actorEmail;
  return bffHandler(() => adminGet<PaginatedAuditLog>(ENDPOINTS.ADMIN.AUDIT_LOG, params));
}
