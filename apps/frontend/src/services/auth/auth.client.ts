// src/services/auth/auth.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import { getRefreshToken, setTokens, clearTokens } from "@/lib/auth-storage";
import type { ClientLoginResponse, CurrentAdmin, LoginRequest } from "@/types";

export async function login(data: LoginRequest): Promise<ClientLoginResponse> {
  const res = await nextjsApiClient.post<ClientLoginResponse>("/auth/login", data);
  setTokens(res.access_token, res.refresh_token);
  return res;
}

export async function logout(): Promise<void> {
  const refresh_token = getRefreshToken();
  try {
    await nextjsApiClient.post<void>("/auth/logout", refresh_token ? { refresh_token } : undefined);
  } finally {
    clearTokens();
  }
}

export async function refresh(): Promise<ClientLoginResponse> {
  const refresh_token = getRefreshToken();
  const res = await nextjsApiClient.post<ClientLoginResponse>(
    "/auth/refresh",
    refresh_token ? { refresh_token } : undefined,
  );
  setTokens(res.access_token, res.refresh_token);
  return res;
}

export async function fetchCurrentAdmin(): Promise<CurrentAdmin> {
  return nextjsApiClient.get<CurrentAdmin>("/auth/me");
}
