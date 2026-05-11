// src/services/uiStrings/uiStrings.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Locale, PublicUiStringsResponse } from "@/types";

/**
 * Client-side UI strings fetch.
 * Normally not needed — strings are loaded server-side in the layout and provided
 * via UiStringsProvider. Use this only for late-bound or filter-specific cases.
 */
export async function fetchUiStrings(
  locale: Locale,
  namespace?: string,
): Promise<PublicUiStringsResponse> {
  return nextjsApiClient.get<PublicUiStringsResponse>("/public/ui-strings", {
    params: { locale, namespace: namespace ?? null },
  });
}
