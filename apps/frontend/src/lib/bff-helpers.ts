// apps/frontend/src/lib/bff-helpers.ts
// Shared route-handler helpers (API Flow guide pattern): standard error envelope, JSON body parse,
// query helpers. Production hides raw error messages.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ApiError } from "./api-errors";

export function errorResponse(code: string, message: string, status: number, extra?: Record<string, unknown>): NextResponse {
return NextResponse.json({ error: { code, message, extra } }, { status });
}

/** Map a thrown error to the standard error envelope. Used in the catch of every route handler. */
export function apiErrorResponse(err: unknown): NextResponse {
	if (err instanceof ApiError) return errorResponse(err.code, err.message, err.status || 500, err.extra);
	// eslint-disable-next-line no-console
	console.error("[API] Unhandled error:", err);
	const raw = err instanceof Error ? err.message : "Unexpected error";
	return errorResponse("INTERNAL", process.env.NODE_ENV === "production" ? "Unexpected error" : raw, 500);
}

export async function parseJsonBody<T>(request: NextRequest): Promise<T | null> {
try {
const text = await request.text();
if (!text) return null;
return JSON.parse(text) as T;
} catch {
return null;
}
}

export function getParam(request: NextRequest, key: string): string | null {
return request.nextUrl.searchParams.get(key);
}

export function validateEnum<T extends string>(value: string | null, allowed: readonly T[], fallback?: T): T | null {
if (value && (allowed as readonly string[]).includes(value)) return value as T;
return fallback ?? null;
}
