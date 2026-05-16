// apps/frontend/src/services/pricing/pricing.server.ts
// Public pricing fetch per-service. Revalidate 10min; admin-bff TAG_MAP invalidates "pricing" on category/item mutation.

import { serverApiClient } from "@/lib/server-api";
import { ApiError } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Locale, PricingCategoryPublic } from "@/types";

const PRICING_REVALIDATE_SECONDS = 600;

export async function getPricingForServiceServer(slug: string, locale: Locale): Promise<PricingCategoryPublic[]> {
const result = await serverApiClient.get<PricingCategoryPublic[]>(ENDPOINTS.PUBLIC.SERVICE_PRICING(slug), {
params: { locale },
revalidate: PRICING_REVALIDATE_SECONDS,
tags: ["pricing", `pricing:${slug}:${locale}`],
});
if (result.error || !result.data) {
throw new ApiError(result.error?.code ?? "EMPTY_RESPONSE", result.error?.message ?? "No pricing returned", result.status, result.error?.extra);
}
return result.data;
}
