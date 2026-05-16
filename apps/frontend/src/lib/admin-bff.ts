// src/lib/admin-bff.ts
// Server-only admin BFF helpers. Auto-revalidates public cache tags on mutations.

import "server-only";
import { revalidateTag } from "next/cache";
import { serverApiClient } from "./server-api";
import { ApiError } from "./api-errors";
import { getAccessTokenFromCookies } from "./auth-utils";

const TAG_MAP: { match: RegExp; tags: string[] }[] = [
  { match: /\/admin\/services/, tags: ["services", "services:de", "services:en"] },
  { match: /\/admin\/vehicles/, tags: ["vehicles", "vehicles:de", "vehicles:en"] },
  { match: /\/admin\/faqs/, tags: ["faqs", "faqs:de", "faqs:en"] },
  { match: /\/admin\/testimonials/, tags: ["testimonials", "testimonials:de", "testimonials:en"] },
  { match: /\/admin\/pricing/, tags: ["pricing", "pricing:de", "pricing:en", "services:de", "services:en"] },
  { match: /\/admin\/ui-strings/, tags: ["ui-strings", "ui-strings:de", "ui-strings:en"] },
  { match: /\/admin\/settings/, tags: ["settings", "settings:de", "settings:en"] },
  { match: /\/admin\/legal-pages/, tags: ["legal-pages", "legal-pages:de", "legal-pages:en"] },
];

function invalidate(path: string): void {
  for (const { match, tags } of TAG_MAP) {
    if (match.test(path)) {
      for (const tag of tags) revalidateTag(tag);
      return;
    }
  }
}

export async function requireAdminToken(): Promise<string> {
  const token = await getAccessTokenFromCookies();
  if (!token) throw new ApiError("UNAUTHORIZED", "Not authenticated", 401);
  return token;
}

export async function adminGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>,
): Promise<T> {
  const token = await requireAdminToken();
  const result = await serverApiClient.get<T>(path, { params }, token);
  if (result.error || result.data === undefined) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "Request failed",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}

export async function adminPatch<T>(path: string, body: unknown): Promise<T> {
  const token = await requireAdminToken();
  const result = await serverApiClient.patch<T>(path, body, undefined, token);
  if (result.error || result.data === undefined) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "Request failed",
      result.status,
      result.error?.extra,
    );
  }
  invalidate(path);
  return result.data;
}

export async function adminPost<T>(path: string, body?: unknown): Promise<T> {
  const token = await requireAdminToken();
  const result = await serverApiClient.post<T>(path, body, undefined, token);
  if (result.error || result.data === undefined) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "Request failed",
      result.status,
      result.error?.extra,
    );
  }
  invalidate(path);
  return result.data;
}

export async function adminDelete(path: string): Promise<void> {
  const token = await requireAdminToken();
  const result = await serverApiClient.delete<void>(path, undefined, token);
  if (result.error) {
    throw new ApiError(result.error.code, result.error.message, result.status, result.error.extra);
  }
  invalidate(path);
}
