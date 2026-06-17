// apps/frontend/src/services/settings/settings.admin.server.ts
// Admin settings server service (BFF → FastAPI with bearer auth). Singleton — no id. Mutations bust public ISR tags.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { revalidateForPath } from "@/lib/revalidate";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { SettingsAdmin } from "@/types";
import type { SettingsUpdate } from "./settings.admin.client";

function unwrap<T>(result: ApiResponse<T>): T {
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

export async function getAdminSettingsServer(authToken: string): Promise<SettingsAdmin> {
  return unwrap(await serverApiClient.get<SettingsAdmin>(ENDPOINTS.ADMIN.SETTINGS, undefined, authToken));
}

export async function updateAdminSettingsServer(data: SettingsUpdate, authToken: string): Promise<SettingsAdmin> {
  const v = unwrap(await serverApiClient.patch<SettingsAdmin>(ENDPOINTS.ADMIN.SETTINGS, data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.SETTINGS);
  return v;
}
