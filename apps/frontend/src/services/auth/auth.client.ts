// src/services/auth/auth.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { ClientLoginResponse, CurrentAdmin, LoginRequest } from "@/types";

export async function login(data: LoginRequest): Promise<ClientLoginResponse> {
  return nextjsApiClient.post<ClientLoginResponse>("/auth/login", data);
}

export async function logout(): Promise<void> {
  await nextjsApiClient.post<void>("/auth/logout");
}

export async function refresh(): Promise<ClientLoginResponse> {
  return nextjsApiClient.post<ClientLoginResponse>("/auth/refresh");
}

export async function fetchCurrentAdmin(): Promise<CurrentAdmin> {
  return nextjsApiClient.get<CurrentAdmin>("/auth/me");
}
