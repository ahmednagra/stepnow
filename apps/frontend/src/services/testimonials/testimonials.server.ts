// src/services/testimonials/testimonials.server.ts
import { serverApiClient } from "@/lib/server-api";
import { ApiError } from "@/lib/api-errors";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Locale, TestimonialPublic } from "@/types";

const TESTIMONIALS_REVALIDATE_SECONDS = 300;

export async function listTestimonialsServer(locale: Locale): Promise<TestimonialPublic[]> {
  const result = await serverApiClient.get<TestimonialPublic[]>(ENDPOINTS.PUBLIC.TESTIMONIALS, {
    params: { locale },
    revalidate: TESTIMONIALS_REVALIDATE_SECONDS,
    tags: ["testimonials", `testimonials:${locale}`],
  });

  if (result.error || !result.data) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "No testimonials returned",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}
