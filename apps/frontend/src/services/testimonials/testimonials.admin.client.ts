// src/services/testimonials/testimonials.admin.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Paginated, TestimonialAdmin } from "@/types";

export interface ListAdminTestimonialsParams {
  page?: number;
  size?: number;
  q?: string;
  include_deleted?: boolean;
}

export interface TestimonialCreateInput {
  sort_order?: number;
  active?: boolean;
  source?: string;
  author_name: string;
  author_role_de?: string | null;
  author_role_en?: string | null;
  author_photo_url?: string | null;
  quote_de: string;
  quote_en: string;
  rating?: number | null;
  date_given?: string | null;
}

export type TestimonialUpdateInput = Partial<TestimonialCreateInput>;

export async function listAdminTestimonials(
  params: ListAdminTestimonialsParams = {},
): Promise<Paginated<TestimonialAdmin>> {
  return nextjsApiClient.get<Paginated<TestimonialAdmin>>("/admin/testimonials", {
    params: { ...params },
  });
}

export async function getAdminTestimonial(id: string): Promise<TestimonialAdmin> {
  return nextjsApiClient.get<TestimonialAdmin>(`/admin/testimonials/${id}`);
}

export async function createAdminTestimonial(
  payload: TestimonialCreateInput,
): Promise<TestimonialAdmin> {
  return nextjsApiClient.post<TestimonialAdmin>("/admin/testimonials", payload);
}

export async function updateAdminTestimonial(
  id: string,
  payload: TestimonialUpdateInput,
): Promise<TestimonialAdmin> {
  return nextjsApiClient.patch<TestimonialAdmin>(`/admin/testimonials/${id}`, payload);
}

export async function deleteAdminTestimonial(id: string): Promise<void> {
  await nextjsApiClient.delete<void>(`/admin/testimonials/${id}`);
}

export async function restoreAdminTestimonial(id: string): Promise<TestimonialAdmin> {
  return nextjsApiClient.post<TestimonialAdmin>(`/admin/testimonials/${id}/restore`);
}
