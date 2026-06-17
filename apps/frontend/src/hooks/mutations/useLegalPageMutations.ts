// src/hooks/mutations/useLegalPageMutations.ts
// React Query WRITE hooks for the legal-pages draft/publish/version flow. Each mutation calls
// the existing legalPages client service, then invalidates list / detail / versions as needed.

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  createAdminLegalPage,
  saveAdminLegalPageDraft,
  publishAdminLegalPage,
  rollbackAdminLegalPage,
  type LegalPageCreateInput,
  type LegalPageDraftInput,
  type LegalPagePublishInput,
  type LegalPageRollbackInput,
} from "@/services/legalPages";

/** Create a new legal page. Invalidates the legal-pages list. */
export function useCreateLegalPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LegalPageCreateInput) => createAdminLegalPage(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.legalPages.lists() });
    },
  });
}

/** Save a draft for a page. Invalidates that page's detail + version history. */
export function useSaveLegalPageDraft(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LegalPageDraftInput) => saveAdminLegalPageDraft(slug, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.legalPages.detail(slug) });
      void qc.invalidateQueries({ queryKey: queryKeys.legalPages.versions(slug) });
    },
  });
}

/** Publish the current draft. Invalidates list + detail + version history. */
export function usePublishLegalPage(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LegalPagePublishInput = {}) => publishAdminLegalPage(slug, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.legalPages.lists() });
      void qc.invalidateQueries({ queryKey: queryKeys.legalPages.detail(slug) });
      void qc.invalidateQueries({ queryKey: queryKeys.legalPages.versions(slug) });
    },
  });
}

/** Roll the draft back to a prior version. Invalidates detail + version history. */
export function useRollbackLegalPage(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: LegalPageRollbackInput) => rollbackAdminLegalPage(slug, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.legalPages.detail(slug) });
      void qc.invalidateQueries({ queryKey: queryKeys.legalPages.versions(slug) });
    },
  });
}
