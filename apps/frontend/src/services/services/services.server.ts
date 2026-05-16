// apps/frontend/src/services/services/services.server.ts
// Public services fetch (list + by-slug). Revalidate 10min; admin-bff TAG_MAP invalidates "services" on admin mutation.

import { serverApiClient } from "@/lib/server-api";
import { ApiError } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Locale, ServicePublic } from "@/types";

const SERVICES_REVALIDATE_SECONDS = 600;

export async function listServicesServer(locale: Locale): Promise<ServicePublic[]> {
const result = await serverApiClient.get<ServicePublic[]>(ENDPOINTS.PUBLIC.SERVICES, {
params: { locale },
revalidate: SERVICES_REVALIDATE_SECONDS,
tags: ["services", `services:${locale}`],
});
if (result.error || !result.data) {
throw new ApiError(result.error?.code ?? "EMPTY_RESPONSE", result.error?.message ?? "No services returned", result.status, result.error?.extra);
}
return result.data;
}

export async function getServiceBySlugServer(slug: string, locale: Locale): Promise<ServicePublic> {
const result = await serverApiClient.get<ServicePublic>(ENDPOINTS.PUBLIC.SERVICE_BY_SLUG(slug), {
params: { locale },
revalidate: SERVICES_REVALIDATE_SECONDS,
tags: ["services", `services:${slug}:${locale}`],
});
if (result.error || !result.data) {
throw new ApiError(result.error?.code ?? "EMPTY_RESPONSE", result.error?.message ?? "Service not found", result.status, result.error?.extra);
}
return result.data;
}
