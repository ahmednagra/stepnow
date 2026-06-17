// src/hooks/mutations/useFaqMutations.ts
// React Query WRITE hooks for FAQs. Each mutation calls the faqs admin client service,
// then invalidates the affected query keys so the list + detail re-fetch.

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  createAdminFaq,
  updateAdminFaq,
  deleteAdminFaq,
  restoreAdminFaq,
  type FaqCreateInput,
  type FaqUpdateInput,
} from "@/services/faqs/faqs.admin.client";

/** Create a FAQ. Invalidates the faqs list. */
export function useCreateFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FaqCreateInput) => createAdminFaq(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.faqs.lists() });
    },
  });
}

/** Update a FAQ. Invalidates detail + list. */
export function useUpdateFaq(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FaqUpdateInput) => updateAdminFaq(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.faqs.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.faqs.lists() });
    },
  });
}

/** Soft-delete a FAQ. Invalidates list + detail. */
export function useDeleteFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminFaq(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.faqs.lists() });
      void qc.invalidateQueries({ queryKey: queryKeys.faqs.detail(id) });
    },
  });
}

/** Restore a soft-deleted FAQ. Invalidates list + detail. */
export function useRestoreFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreAdminFaq(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.faqs.lists() });
      void qc.invalidateQueries({ queryKey: queryKeys.faqs.detail(id) });
    },
  });
}
