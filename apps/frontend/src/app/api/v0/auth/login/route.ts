// src/app/api/v0/auth/login/route.ts
import type { NextRequest } from "next/server";
import { bffHandler, errorResponse, parseJsonBody } from "@/lib/bff-helpers";
import { setAuthCookies } from "@/lib/auth-utils";
import { loginServer } from "@/services/auth";
import type { ClientLoginResponse, LoginRequest } from "@/types";

export async function POST(request: NextRequest) {
  const body = await parseJsonBody<LoginRequest>(request);
  if (!body || !body.email || !body.password) {
    return errorResponse("BAD_REQUEST", "email and password are required", 400);
  }

  return bffHandler(async (): Promise<ClientLoginResponse> => {
    const result = await loginServer(body);
    await setAuthCookies({
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      accessMaxAge: result.expires_in,
    });
    return { ok: true, expires_in: result.expires_in };
  });
}
