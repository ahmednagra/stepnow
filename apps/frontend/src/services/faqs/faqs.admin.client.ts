// src/services/faqs/faqs.admin.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, FaqAdmin } from "@/types";

export interface ListAdminFaqsParams {
  page?: number;
  size?: number;
  q?: string;
  include_deleted?: boolean;
}

export interface FaqCreateInput {
  sort_order?: number;
  active?: boolean;
  category?: string;
  question_de: string;
  question_en: string;
  answer_de: string;
  answer_en: string;
}

export type FaqUpdateInput = Partial<FaqCreateInput>;

export async function listAdminFaqs(params: ListAdminFaqsParams = {}): Promise<Paginated<FaqAdmin>> {
  return nextjsApiClient.get<Paginated<FaqAdmin>>(ENDPOINTS.ADMIN.FAQS, {
    params: { ...params },
  });
}

export async function getAdminFaq(id: string): Promise<FaqAdmin> {
  return nextjsApiClient.get<FaqAdmin>(ENDPOINTS.ADMIN.FAQ_BY_ID(id));
}

export async function createAdminFaq(payload: FaqCreateInput): Promise<FaqAdmin> {
  return nextjsApiClient.post<FaqAdmin>(ENDPOINTS.ADMIN.FAQS, payload);
}

export async function updateAdminFaq(id: string, payload: FaqUpdateInput): Promise<FaqAdmin> {
  return nextjsApiClient.patch<FaqAdmin>(ENDPOINTS.ADMIN.FAQ_BY_ID(id), payload);
}

export async function deleteAdminFaq(id: string): Promise<void> {
  await nextjsApiClient.delete<void>(ENDPOINTS.ADMIN.FAQ_BY_ID(id));
}

export async function restoreAdminFaq(id: string): Promise<FaqAdmin> {
  return nextjsApiClient.post<FaqAdmin>(ENDPOINTS.ADMIN.FAQ_RESTORE(id));
}
