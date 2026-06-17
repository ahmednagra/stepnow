// src/app/api/v0/auth/login/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, parseJsonBody, apiErrorResponse } from "@/lib/bff-helpers";
import { loginServer } from "@/services/auth";
import type { LoginRequest } from "@/types";

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<LoginRequest>(request);
  if (!body || !body.email || !body.password) {
    return errorResponse("BAD_REQUEST", "email and password are required", 400);
  }
  try {
    const result = await loginServer(body);
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
