// src/services/services/services.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Locale, ServicePublic } from "@/types";

export async function fetchServices(locale: Locale): Promise<ServicePublic[]> {
  return nextjsApiClient.get<ServicePublic[]>("/public/services", { params: { locale } });
}

export async function fetchServiceBySlug(slug: string, locale: Locale): Promise<ServicePublic> {
  return nextjsApiClient.get<ServicePublic>(
    `/public/services/${encodeURIComponent(slug)}`,
    { params: { locale } },
  );
}
