// src/services/auth/auth.server.ts
import { serverApiClient } from "@/lib/server-api";
import { ApiError } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { BackendLoginResponse, CurrentAdmin, LoginRequest } from "@/types";

/** Calls FastAPI /auth/login. Returns full token pair so the BFF can set cookies. */
export async function loginServer(data: LoginRequest): Promise<BackendLoginResponse> {
  const result = await serverApiClient.post<BackendLoginResponse>(ENDPOINTS.AUTH.LOGIN, data);
  if (result.error || !result.data) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "Login failed",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}

export async function refreshServer(refreshToken: string): Promise<BackendLoginResponse> {
  const result = await serverApiClient.post<BackendLoginResponse>(ENDPOINTS.AUTH.REFRESH, {
    refresh_token: refreshToken,
  });
  if (result.error || !result.data) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "Token refresh failed",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}

export async function logoutServer(refreshToken: string): Promise<void> {
  const result = await serverApiClient.post<void>(ENDPOINTS.AUTH.LOGOUT, {
    refresh_token: refreshToken,
  });
  if (result.error) {
    // logout is forgiving — don't fail the BFF route on backend errors
    // The cookies are cleared regardless.
    return;
  }
}

export async function getMeServer(accessToken: string): Promise<CurrentAdmin> {
  const result = await serverApiClient.get<CurrentAdmin>(
    ENDPOINTS.AUTH.ME,
    undefined,
    accessToken,
  );
  if (result.error || !result.data) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "Could not fetch current user",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}
