// src/lib/auth-utils.ts
// httpOnly cookie management for JWT auth.
// Browser JS can never read these. The BFF reads them via next/headers `cookies()`.

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const ACCESS_COOKIE = "sn_access";
const REFRESH_COOKIE = "sn_refresh";

// Defaults; access tokens are short (FastAPI default 60min), refresh long (7 days).
const ACCESS_MAX_AGE_SECONDS = 60 * 60; // 1h, refreshed before expiry
const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

interface SetTokensInput {
  accessToken: string;
  refreshToken: string;
  accessMaxAge?: number;
  refreshMaxAge?: number;
}

function isSecure(): boolean {
  if (process.env.COOKIE_SECURE === "false") return false;
  if (process.env.COOKIE_SECURE === "true") return true;
  return process.env.NODE_ENV === "production";
}

/** Called from BFF auth routes (login, refresh) to set both cookies. */
export async function setAuthCookies({
  accessToken,
  refreshToken,
  accessMaxAge,
  refreshMaxAge,
}: SetTokensInput): Promise<void> {
  const cookieStore = await cookies();
  const secure = isSecure();
  cookieStore.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: accessMaxAge ?? ACCESS_MAX_AGE_SECONDS,
  });
  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: refreshMaxAge ?? REFRESH_MAX_AGE_SECONDS,
  });
}

/** Called from BFF logout route. */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  cookieStore.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
}

/** Read access token (server context only). Returns null if missing. */
export async function getAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE)?.value ?? null;
}

/** Read refresh token (server context only). */
export async function getRefreshTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE)?.value ?? null;
}

/**
 * Edge-case helper: read access token directly from a NextRequest object
 * (used in middleware where cookies() may not be available).
 */
export function getAccessTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(ACCESS_COOKIE)?.value ?? null;
}

/** Legacy bearer-from-header helper, kept for parity with the API Flow Guide. */
export function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) return null;
  return header.substring(7).trim() || null;
}
