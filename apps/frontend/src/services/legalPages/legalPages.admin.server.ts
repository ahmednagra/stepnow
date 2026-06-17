// apps/frontend/src/services/legalPages/legalPages.admin.server.ts
// Admin legal-pages server service (BFF → FastAPI with bearer auth). Mutations bust public ISR tags.

import "server-only";
import { serverApiClient } from "@/lib/server-api";
import { ApiError, type ApiResponse } from "@/lib/api-errors";
import { revalidateForPath } from "@/lib/revalidate";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { LegalPageAdmin, LegalPageVersionAdmin } from "@/types";
import type {
  LegalPageCreateInput,
  LegalPageDraftInput,
  LegalPagePublishInput,
  LegalPageRollbackInput,
  LegalPagePreviewResponse,
} from "./legalPages.admin.client";

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

export async function listAdminLegalPagesServer(params: Record<string, string | number | boolean | null | undefined>, authToken: string): Promise<{ items: LegalPageAdmin[] }> {
  return unwrap(await serverApiClient.get<{ items: LegalPageAdmin[] }>(ENDPOINTS.ADMIN.LEGAL_PAGES, { params }, authToken));
}

export async function getAdminLegalPageServer(slug: string, authToken: string): Promise<LegalPageAdmin> {
  return unwrap(await serverApiClient.get<LegalPageAdmin>(ENDPOINTS.ADMIN.LEGAL_PAGE(slug), undefined, authToken));
}

export async function createAdminLegalPageServer(data: LegalPageCreateInput, authToken: string): Promise<LegalPageAdmin> {
  const p = unwrap(await serverApiClient.post<LegalPageAdmin>(ENDPOINTS.ADMIN.LEGAL_PAGES, data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.LEGAL_PAGES);
  return p;
}

export async function saveAdminLegalPageDraftServer(slug: string, data: LegalPageDraftInput, authToken: string): Promise<LegalPageAdmin> {
  const p = unwrap(await serverApiClient.patch<LegalPageAdmin>(ENDPOINTS.ADMIN.LEGAL_PAGE_DRAFT(slug), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.LEGAL_PAGES);
  return p;
}

export async function publishAdminLegalPageServer(slug: string, data: LegalPagePublishInput, authToken: string): Promise<LegalPageAdmin> {
  const p = unwrap(await serverApiClient.post<LegalPageAdmin>(ENDPOINTS.ADMIN.LEGAL_PAGE_PUBLISH(slug), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.LEGAL_PAGES);
  return p;
}

export async function rollbackAdminLegalPageServer(slug: string, data: LegalPageRollbackInput, authToken: string): Promise<LegalPageAdmin> {
  const p = unwrap(await serverApiClient.post<LegalPageAdmin>(ENDPOINTS.ADMIN.LEGAL_PAGE_ROLLBACK(slug), data, undefined, authToken));
  revalidateForPath(ENDPOINTS.ADMIN.LEGAL_PAGES);
  return p;
}

export async function listAdminLegalPageVersionsServer(slug: string, authToken: string): Promise<{ items: LegalPageVersionAdmin[] }> {
  return unwrap(await serverApiClient.get<{ items: LegalPageVersionAdmin[] }>(ENDPOINTS.ADMIN.LEGAL_PAGE_VERSIONS(slug), undefined, authToken));
}

export async function previewAdminLegalPageServer(slug: string, authToken: string): Promise<LegalPagePreviewResponse> {
  return unwrap(await serverApiClient.get<LegalPagePreviewResponse>(ENDPOINTS.ADMIN.LEGAL_PAGE_PREVIEW(slug), undefined, authToken));
}
