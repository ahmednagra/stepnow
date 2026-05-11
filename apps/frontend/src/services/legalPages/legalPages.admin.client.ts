// src/services/legalPages/legalPages.admin.client.ts
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { LegalPageAdmin, LegalPageVersionAdmin } from "@/types";

export interface ListAdminLegalPagesParams {
  include_deleted?: boolean;
}

export interface LegalPageCreateInput {
  slug: string;
}

export interface LegalPageDraftInput {
  title_de: string;
  title_en: string;
  body_de: string;
  body_en: string;
  changes_summary?: string | null;
}

export interface LegalPagePublishInput {
  changes_summary?: string | null;
}

export interface LegalPageRollbackInput {
  target_version_id: string;
  changes_summary?: string | null;
}

export interface LegalPagePreviewResponse {
  title_de: string;
  title_en: string;
  body_de: string;
  body_en: string;
  placeholders_used: string[];
  placeholders_unresolved: string[];
}

export async function listAdminLegalPages(
  params: ListAdminLegalPagesParams = {},
): Promise<{ items: LegalPageAdmin[] }> {
  return nextjsApiClient.get<{ items: LegalPageAdmin[] }>("/admin/legal-pages", {
    params: { ...params },
  });
}

export async function getAdminLegalPage(slug: string): Promise<LegalPageAdmin> {
  return nextjsApiClient.get<LegalPageAdmin>(`/admin/legal-pages/${slug}`);
}

export async function createAdminLegalPage(
  payload: LegalPageCreateInput,
): Promise<LegalPageAdmin> {
  return nextjsApiClient.post<LegalPageAdmin>("/admin/legal-pages", payload);
}

export async function saveAdminLegalPageDraft(
  slug: string,
  payload: LegalPageDraftInput,
): Promise<LegalPageAdmin> {
  return nextjsApiClient.patch<LegalPageAdmin>(`/admin/legal-pages/${slug}/draft`, payload);
}

export async function publishAdminLegalPage(
  slug: string,
  payload: LegalPagePublishInput = {},
): Promise<LegalPageAdmin> {
  return nextjsApiClient.post<LegalPageAdmin>(`/admin/legal-pages/${slug}/publish`, payload);
}

export async function rollbackAdminLegalPage(
  slug: string,
  payload: LegalPageRollbackInput,
): Promise<LegalPageAdmin> {
  return nextjsApiClient.post<LegalPageAdmin>(`/admin/legal-pages/${slug}/rollback`, payload);
}

export async function listAdminLegalPageVersions(
  slug: string,
): Promise<{ items: LegalPageVersionAdmin[] }> {
  return nextjsApiClient.get<{ items: LegalPageVersionAdmin[] }>(
    `/admin/legal-pages/${slug}/versions`,
  );
}

export async function previewAdminLegalPage(
  slug: string,
): Promise<LegalPagePreviewResponse> {
  return nextjsApiClient.get<LegalPagePreviewResponse>(`/admin/legal-pages/${slug}/preview`);
}
