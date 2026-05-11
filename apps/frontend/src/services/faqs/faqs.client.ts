// src/services/faqs/faqs.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { FaqPublic, Locale } from "@/types";

export async function fetchFaqs(locale: Locale, category?: string): Promise<FaqPublic[]> {
  return nextjsApiClient.get<FaqPublic[]>("/public/faqs", {
    params: { locale, category: category ?? null },
  });
}
