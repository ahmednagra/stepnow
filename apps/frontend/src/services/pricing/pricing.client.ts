// src/services/pricing/pricing.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Locale, PricingCategoryPublic } from "@/types";

export async function fetchPricingForService(
  slug: string,
  locale: Locale,
): Promise<PricingCategoryPublic[]> {
  return nextjsApiClient.get<PricingCategoryPublic[]>(
    `/public/services/${encodeURIComponent(slug)}/pricing`,
    { params: { locale } },
  );
}
