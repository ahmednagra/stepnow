// src/app/api/v0/admin/settings/route.ts
import type { NextRequest } from "next/server";
import { bffHandler, parseJsonBody } from "@/lib/bff-helpers";
import { adminGet, adminPatch } from "@/lib/admin-bff";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { SettingsAdmin } from "@/types";

export async function GET() {
  return bffHandler(() => adminGet<SettingsAdmin>(ENDPOINTS.ADMIN.SETTINGS));
}

export async function PATCH(request: NextRequest) {
  const body = await parseJsonBody<Record<string, unknown>>(request);
  if (!body) return bffHandler(async () => Promise.reject(new Error("Empty body")));
  return bffHandler(() => adminPatch<SettingsAdmin>(ENDPOINTS.ADMIN.SETTINGS, body));
}
