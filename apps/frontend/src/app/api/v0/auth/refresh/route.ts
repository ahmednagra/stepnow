// src/app/api/v0/auth/refresh/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { refreshServer } from "@/services/auth";

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<{ refresh_token?: string }>(request);
  if (!body?.refresh_token) {
    return errorResponse("UNAUTHORIZED", "No refresh token", 401);
  }
  try {
    const result = await refreshServer(body.refresh_token);
    return NextResponse.json({
      ok: true,
      access_token: result.access_token,
      refresh_token: result.refresh_token,
      expires_in: result.expires_in,
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
