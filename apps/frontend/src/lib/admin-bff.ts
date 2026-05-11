// src/lib/admin-bff.ts
// Server-only. Helpers for admin BFF routes: enforce auth + proxy with the
// access token forwarded as a Bearer header.

import "server-only";
import { serverApiClient } from "./server-api";
import { ApiError } from "./api-errors";
import { getAccessTokenFromCookies } from "./auth-utils";

/**
 * Require an authenticated admin (access cookie present). Returns the token
 * or throws ApiError(UNAUTHORIZED). Use as the first line of every admin BFF
 * route handler.
 */
export async function requireAdminToken(): Promise<string> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    throw new ApiError("UNAUTHORIZED", "Not authenticated", 401);
  }
  return token;
}

/** Server-side GET with the admin token forwarded. */
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

/** Server-side PATCH with the admin token forwarded. */
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
  return result.data;
}
