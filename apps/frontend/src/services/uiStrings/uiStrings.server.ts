// src/services/uiStrings/uiStrings.server.ts
import { serverApiClient } from "@/lib/server-api";
import { ApiError } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Locale, PublicUiStringsResponse } from "@/types";

const UI_STRINGS_REVALIDATE_SECONDS = 300;

/**
 * Fetch UI strings for a locale, optionally filtered by namespace.
 * Used by RSCs (via the layout) and by the BFF route.
 *
 * Returns an envelope; the caller decides what to do on error.
 */
export async function getUiStringsServer(
  locale: Locale,
  namespace?: string,
): Promise<PublicUiStringsResponse> {
  const result = await serverApiClient.get<PublicUiStringsResponse>(ENDPOINTS.PUBLIC.UI_STRINGS, {
    params: { locale, namespace: namespace ?? null },
    revalidate: UI_STRINGS_REVALIDATE_SECONDS,
    tags: ["ui-strings", `ui-strings:${locale}`],
  });

  if (result.error) {
    throw new ApiError(
      result.error.code,
      result.error.message,
      result.status,
      result.error.extra,
    );
  }
  if (!result.data) {
    throw new ApiError("EMPTY_RESPONSE", "No UI strings returned", result.status);
  }
  return result.data;
}
