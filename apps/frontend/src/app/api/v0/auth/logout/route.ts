// src/app/api/v0/auth/logout/route.ts
import { NextResponse } from "next/server";
import { clearAuthCookies, getRefreshTokenFromCookies } from "@/lib/auth-utils";
import { logoutServer } from "@/services/auth";

export async function POST() {
  const refreshToken = await getRefreshTokenFromCookies();
  if (refreshToken) {
    // Tell FastAPI to invalidate. If this fails we still clear cookies locally.
    try {
      await logoutServer(refreshToken);
    } catch {
      // intentional swallow — see logoutServer doc
    }
  }
  await clearAuthCookies();
  return new NextResponse(null, { status: 204 });
}
