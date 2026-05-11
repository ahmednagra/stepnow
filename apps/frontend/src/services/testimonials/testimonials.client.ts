// src/services/testimonials/testimonials.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Locale, TestimonialPublic } from "@/types";

export async function fetchTestimonials(locale: Locale): Promise<TestimonialPublic[]> {
  return nextjsApiClient.get<TestimonialPublic[]>("/public/testimonials", { params: { locale } });
}
