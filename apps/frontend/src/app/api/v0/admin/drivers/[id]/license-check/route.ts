// src/app/api/v0/admin/drivers/[id]/license-check/route.ts
// BFF handler for recording a §21 StVG licence check. Forwards to FastAPI.

import { NextResponse, type NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth-utils";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { recordLicenseCheckServer } from "@/services/drivers/drivers.admin.server";
import type { LicenseCheckInput } from "@/services/drivers/drivers.admin.client";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Authentication token is required", 401);
  const body = (await parseJsonBody<LicenseCheckInput>(request)) ?? {};
  try {
    return NextResponse.json(await recordLicenseCheckServer(params.id, body, token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
