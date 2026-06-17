// src/app/api/v0/admin/audit-log/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { listAuditLogServer } from "@/services/auditLog/auditLog.server";

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number> = {};
  const page = sp.get("page");
  const size = sp.get("size");
  const tableName = sp.get("table_name");
  const action = sp.get("action");
  const actorEmail = sp.get("actor_email");
  const recordId = sp.get("record_id");
  const fromDate = sp.get("from_date");
  const toDate = sp.get("to_date");
  if (page) params.page = Number(page);
  if (size) params.size = Number(size);
  if (tableName) params.table_name = tableName;
  if (action) params.action = action;
  if (actorEmail) params.actor_email = actorEmail;
  if (recordId) params.record_id = recordId;
  if (fromDate) params.from_date = fromDate;
  if (toDate) params.to_date = toDate;
  try {
    return NextResponse.json(await listAuditLogServer(params, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
