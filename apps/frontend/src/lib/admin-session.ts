// src/lib/admin-session.ts
// Server-only. Reads the access cookie, calls FastAPI /auth/me, returns the
// current admin or null. Never throws — the layout uses null to redirect.

import "server-only";
import { getAccessTokenFromCookies } from "./auth-utils";
import { getMeServer } from "@/services/auth";
import type { CurrentAdmin } from "@/types";

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;
  try {
    const admin = await getMeServer(token);
    return admin.active ? admin : null;
  } catch {
    // Bad/expired token or backend unreachable — treat as no session.
    // The user will be redirected to /admin/login.
    return null;
  }
}
