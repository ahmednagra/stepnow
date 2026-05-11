// src/services/faqs/faqs.server.ts
import { serverApiClient } from "@/lib/server-api";
import { ApiError } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { FaqPublic, Locale } from "@/types";

const FAQS_REVALIDATE_SECONDS = 300;

export async function listFaqsServer(locale: Locale, category?: string): Promise<FaqPublic[]> {
  const result = await serverApiClient.get<FaqPublic[]>(ENDPOINTS.PUBLIC.FAQS, {
    params: { locale, category: category ?? null },
    revalidate: FAQS_REVALIDATE_SECONDS,
    tags: ["faqs", `faqs:${locale}`, category ? `faqs:${category}` : "faqs:all"],
  });

  if (result.error || !result.data) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "No FAQs returned",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}
