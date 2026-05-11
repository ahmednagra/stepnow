// src/services/legalPages/legalPages.server.ts
import { serverApiClient } from "@/lib/server-api";
import { ApiError } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { LegalPagePublic, Locale } from "@/types";

const LEGAL_PAGE_REVALIDATE_SECONDS = 600;

export async function getLegalPageServer(
  slug: string,
  locale: Locale,
): Promise<LegalPagePublic> {
  const result = await serverApiClient.get<LegalPagePublic>(ENDPOINTS.PUBLIC.LEGAL_PAGE(slug), {
    params: { locale },
    revalidate: LEGAL_PAGE_REVALIDATE_SECONDS,
    tags: ["legal-pages", `legal-pages:${slug}:${locale}`],
  });

  if (result.error || !result.data) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "Legal page not found",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}
