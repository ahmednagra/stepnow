// src/services/pricing/pricing.server.ts
import { serverApiClient } from "@/lib/server-api";
import { ApiError } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Locale, PricingCategoryPublic } from "@/types";

const PRICING_REVALIDATE_SECONDS = 300;

export async function getPricingForServiceServer(
  slug: string,
  locale: Locale,
): Promise<PricingCategoryPublic[]> {
  const result = await serverApiClient.get<PricingCategoryPublic[]>(
    ENDPOINTS.PUBLIC.SERVICE_PRICING(slug),
    {
      params: { locale },
      revalidate: PRICING_REVALIDATE_SECONDS,
      tags: ["pricing", `pricing:${slug}:${locale}`],
    },
  );

  if (result.error || !result.data) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "No pricing returned",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}
