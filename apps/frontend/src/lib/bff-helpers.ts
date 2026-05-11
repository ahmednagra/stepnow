// src/lib/bff-helpers.ts
// Shared helpers for BFF Route Handlers. Keeps each route.ts compact and consistent.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ApiError } from "./api-errors";

/** Build a JSON error response with our standard envelope. */
export function errorResponse(
  code: string,
  message: string,
  status: number,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ error: { code, message, extra } }, { status });
}

/** Convert an ApiError (thrown by a server service) into a NextResponse. */
export function errorFromApiError(err: ApiError): NextResponse {
  return errorResponse(err.code, err.message, err.status || 500, err.extra);
}

/**
 * Wrap an async BFF handler with standardized error handling.
 * Catches ApiError and unexpected errors, returns the right envelope.
 */
export async function bffHandler<T>(
  fn: () => Promise<T>,
  successStatus = 200,
): Promise<NextResponse> {
  try {
    const data = await fn();
    if (data === undefined || successStatus === 204) {
      return new NextResponse(null, { status: 204 });
    }
    return NextResponse.json(data, { status: successStatus });
  } catch (err) {
    if (err instanceof ApiError) return errorFromApiError(err);
    const message = err instanceof Error ? err.message : "Unexpected error";
    // eslint-disable-next-line no-console
    console.error("[BFF] Unhandled error:", err);
    return errorResponse("INTERNAL", message, 500);
  }
}

/** Parse JSON body from a NextRequest with a typed fallback on failure. */
export async function parseJsonBody<T>(request: NextRequest): Promise<T | null> {
  try {
    const text = await request.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

/** Get a single query string param. */
export function getParam(request: NextRequest, key: string): string | null {
  return request.nextUrl.searchParams.get(key);
}

/**
 * Validate that a value is one of an allowed set (e.g. locale "de" | "en").
 * Returns the typed value or null if invalid.
 */
export function validateEnum<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback?: T,
): T | null {
  if (value && (allowed as readonly string[]).includes(value)) return value as T;
  return fallback ?? null;
}
