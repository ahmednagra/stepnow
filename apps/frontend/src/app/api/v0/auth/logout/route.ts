// src/app/api/v0/auth/logout/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { parseJsonBody } from "@/lib/bff-helpers";
import { logoutServer } from "@/services/auth";

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<{ refresh_token?: string }>(request);
  if (body?.refresh_token) {
    // Tell FastAPI to invalidate. If this fails the client still clears its tokens.
    try {
      await logoutServer(body.refresh_token);
    } catch {
      // intentional swallow — see logoutServer doc
    }
  }
  return new NextResponse(null, { status: 204 });
}
