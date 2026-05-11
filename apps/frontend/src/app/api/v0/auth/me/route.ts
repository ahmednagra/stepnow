// src/app/api/v0/auth/me/route.ts
import { bffHandler, errorResponse } from "@/lib/bff-helpers";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { getMeServer } from "@/services/auth";

export async function GET() {
  const token = await getAccessTokenFromCookies();
  if (!token) return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  return bffHandler(() => getMeServer(token));
}
