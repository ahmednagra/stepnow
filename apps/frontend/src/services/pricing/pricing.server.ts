// apps/frontend/src/services/pricing/pricing.server.ts
// Public pricing fetches. listAllPricingServer() batches all services in a single backend round-trip; admin-bff invalidates "pricing" tag on mutation.

import { serverApiClient } from "@/lib/server-api";
import { ApiError } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Locale, PricingCategoryPublic } from "@/types";

const PRICING_REVALIDATE_SECONDS = 600;

export interface PricingGroupedByService {
service_id: string;
service_slug: string;
categories: PricingCategoryPublic[];
}

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

export async function listAllPricingServer(locale: Locale): Promise<PricingGroupedByService[]> {
const result = await serverApiClient.get<PricingGroupedByService[]>(ENDPOINTS.PUBLIC.PRICING_ALL, {
params: { locale },
revalidate: PRICING_REVALIDATE_SECONDS,
tags: ["pricing", `pricing:${locale}`],
});
if (result.error || !result.data) {
throw new ApiError(result.error?.code ?? "EMPTY_RESPONSE", result.error?.message ?? "No pricing returned", result.status, result.error?.extra);
}
return result.data;
}
