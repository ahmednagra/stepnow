// src/app/api/v0/admin/bookings/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { listAdminBookingsServer } from "@/services/bookings/bookings.admin.server";

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const sp = request.nextUrl.searchParams;
  const params: Record<string, string | number | boolean> = {};
  if (sp.get("page")) params.page = Number(sp.get("page"));
  if (sp.get("size")) params.size = Number(sp.get("size"));
  if (sp.get("status")) params.status = sp.get("status")!;
  if (sp.get("q")) params.q = sp.get("q")!;
  if (sp.get("from_date")) params.from_date = sp.get("from_date")!;
  if (sp.get("to_date")) params.to_date = sp.get("to_date")!;
  if (sp.get("service_id")) params.service_id = sp.get("service_id")!;
  if (sp.get("include_deleted") === "true") params.include_deleted = true;
  try {
    return NextResponse.json(await listAdminBookingsServer(params, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
