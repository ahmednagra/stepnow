// src/lib/auth-utils.ts
// Server-side bearer-token helpers for the BFF. Clean-cut localStorage auth:
// the browser sends `Authorization: Bearer <token>`; the BFF reads it here.

import { headers } from "next/headers";
import type { NextRequest } from "next/server";

function parseBearer(header: string | null): string | null {
  if (!header || !header.toLowerCase().startsWith("bearer ")) return null;
  return header.substring(7).trim() || null;
}

/** Read the bearer token from a NextRequest (route handlers that receive the request). */
export function extractBearerToken(request: NextRequest): string | null {
  return parseBearer(request.headers.get("authorization"));
}

/** Read the bearer token ambiently via next/headers (helpers without the request object). */
export async function getBearerTokenFromHeaders(): Promise<string | null> {
  const h = await headers();
  return parseBearer(h.get("authorization"));
}
