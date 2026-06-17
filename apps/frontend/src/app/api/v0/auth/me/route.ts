// src/app/api/v0/auth/me/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { errorResponse, apiErrorResponse } from "@/lib/bff-helpers";
import { extractBearerToken } from "@/lib/auth-utils";
import { getMeServer } from "@/services/auth";

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  try {
    return NextResponse.json(await getMeServer(token));
  } catch (err) {
    return apiErrorResponse(err);
  }
}
