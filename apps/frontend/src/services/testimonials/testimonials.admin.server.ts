// apps/frontend/src/services/testimonials/testimonials.admin.server.ts
// Admin testimonials server service (BFF → FastAPI with bearer auth). Mutations bust public ISR tags.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { revalidateForPath } from "@/lib/revalidate";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, TestimonialAdmin } from "@/types";
import type { TestimonialCreateInput, TestimonialUpdateInput } from "./testimonials.admin.client";

function unwrap<T>(result: ApiResponse<T>): T {
  if (result.error || result.data === undefined) {
    throw new ApiError(
      result.error?.code ?? "EMPTY_RESPONSE",
      result.error?.message ?? "Request failed",
      result.status,
      result.error?.extra,
    );
  }
  return result.data;
}

export async function listAdminTestimonialsServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<Paginated<TestimonialAdmin>> {
  return unwrap(await serverApiClient.get<Paginated<TestimonialAdmin>>(ENDPOINTS.ADMIN.TESTIMONIALS, { params }, authToken));
}

export async function getAdminTestimonialServer(id: string, authToken: string): Promise<TestimonialAdmin> {
  return unwrap(await serverApiClient.get<TestimonialAdmin>(ENDPOINTS.ADMIN.TESTIMONIAL_BY_ID(id), undefined, authToken));
}

export async function createAdminTestimonialServer(data: TestimonialCreateInput, authToken: string): Promise<TestimonialAdmin> {
  const v = unwrap(await serverApiClient.post<TestimonialAdmin>(ENDPOINTS.ADMIN.TESTIMONIALS, data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.TESTIMONIALS);
  return v;
}

export async function updateAdminTestimonialServer(id: string, data: TestimonialUpdateInput, authToken: string): Promise<TestimonialAdmin> {
  const v = unwrap(await serverApiClient.patch<TestimonialAdmin>(ENDPOINTS.ADMIN.TESTIMONIAL_BY_ID(id), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.TESTIMONIALS);
  return v;
}

export async function deleteAdminTestimonialServer(id: string, authToken: string): Promise<void> {
  const r = await serverApiClient.delete<void>(ENDPOINTS.ADMIN.TESTIMONIAL_BY_ID(id), undefined, authToken);
  if (r.error) throw new ApiError(r.error.code, r.error.message, r.status, r.error.extra);
  revalidateForPath(ENDPOINTS.ADMIN.TESTIMONIALS);
}

export async function restoreAdminTestimonialServer(id: string, authToken: string): Promise<TestimonialAdmin> {
  const v = unwrap(await serverApiClient.post<TestimonialAdmin>(ENDPOINTS.ADMIN.TESTIMONIAL_RESTORE(id), undefined, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.TESTIMONIALS);
  return v;
}
