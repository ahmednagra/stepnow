// src/app/api/v0/admin/settings/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import {
  getAdminSettingsServer,
  updateAdminSettingsServer,
} from "@/services/settings/settings.admin.server";
import type { SettingsUpdate } from "@/services/settings/settings.admin.client";

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  try {
    return NextResponse.json(await getAdminSettingsServer(token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}

export async function PATCH(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = await parseJsonBody<SettingsUpdate>(request);
  if (!body) return errorResponse("BAD_REQUEST", "Empty body", 400);
  try {
    return NextResponse.json(await updateAdminSettingsServer(body, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
