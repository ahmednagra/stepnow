// src/services/settings/settings.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Locale, SettingsPublic } from "@/types";

export async function fetchSettings(locale: Locale): Promise<SettingsPublic> {
  return nextjsApiClient.get<SettingsPublic>("/public/settings", { params: { locale } });
}
