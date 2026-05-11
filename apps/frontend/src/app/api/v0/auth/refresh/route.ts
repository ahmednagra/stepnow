// src/app/api/v0/auth/refresh/route.ts
import { bffHandler, errorResponse } from "@/lib/bff-helpers";
import {
  clearAuthCookies,
  getRefreshTokenFromCookies,
  setAuthCookies,
} from "@/lib/auth-utils";
import { refreshServer } from "@/services/auth";
import { ApiError } from "@/lib/api-errors";
import type { ClientLoginResponse } from "@/types";

export async function POST() {
  const refreshToken = await getRefreshTokenFromCookies();
  if (!refreshToken) {
    return errorResponse("UNAUTHORIZED", "No refresh token", 401);
  }

  return bffHandler(async (): Promise<ClientLoginResponse> => {
    try {
      const result = await refreshServer(refreshToken);
      await setAuthCookies({
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
        accessMaxAge: result.expires_in,
      });
      return { ok: true, expires_in: result.expires_in };
    } catch (err) {
      // If refresh fails, clear cookies so the browser doesn't keep retrying
      await clearAuthCookies();
      throw err instanceof ApiError
        ? err
        : new ApiError("REFRESH_FAILED", "Could not refresh session", 401);
    }
  });
}
