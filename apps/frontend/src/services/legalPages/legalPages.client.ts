// src/services/legalPages/legalPages.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { LegalPagePublic, Locale } from "@/types";

export async function fetchLegalPage(slug: string, locale: Locale): Promise<LegalPagePublic> {
  return nextjsApiClient.get<LegalPagePublic>(
    `/public/legal-pages/${encodeURIComponent(slug)}`,
    { params: { locale } },
  );
}
