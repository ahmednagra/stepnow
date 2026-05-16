// apps/frontend/src/lib/bff-helpers.ts
// Shared helpers for BFF Route Handlers. Standard error envelope, JSON body parse, query helpers. Production hides raw error messages.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ApiError } from "./api-errors";

export function errorResponse(code: string, message: string, status: number, extra?: Record<string, unknown>): NextResponse {
return NextResponse.json({ error: { code, message, extra } }, { status });
}

export function errorFromApiError(err: ApiError): NextResponse {
return errorResponse(err.code, err.message, err.status || 500, err.extra);
}

export async function bffHandler<T>(fn: () => Promise<T>, successStatus = 200): Promise<NextResponse> {
try {
const data = await fn();
if (data === undefined || successStatus === 204) return new NextResponse(null, { status: 204 });
return NextResponse.json(data, { status: successStatus });
} catch (err) {
if (err instanceof ApiError) return errorFromApiError(err);
const rawMessage = err instanceof Error ? err.message : "Unexpected error";
// eslint-disable-next-line no-console
console.error("[BFF] Unhandled error:", err);
const safeMessage = process.env.NODE_ENV === "production" ? "Unexpected error" : rawMessage;
return errorResponse("INTERNAL", safeMessage, 500);
}
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
