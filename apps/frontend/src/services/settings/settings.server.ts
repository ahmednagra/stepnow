// src/services/settings/settings.server.ts
import { serverApiClient } from "@/lib/server-api";
import { ApiError } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Locale, SettingsPublic } from "@/types";

const SETTINGS_REVALIDATE_SECONDS = 300;

export async function getSettingsServer(locale: Locale): Promise<SettingsPublic> {
  const result = await serverApiClient.get<SettingsPublic>(ENDPOINTS.PUBLIC.SETTINGS, {
    params: { locale },
    revalidate: SETTINGS_REVALIDATE_SECONDS,
    tags: ["settings", `settings:${locale}`],
  });

  if (result.error || !result.data) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "No settings returned",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}
