// src/hooks/mutations/useUiStringMutations.ts
// React Query WRITE hooks for UI strings. Each mutation calls the existing uiStrings admin client
// service, then invalidates the lists (+ detail on update) so the table re-fetches.

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  createAdminUiString,
  updateAdminUiString,
  deleteAdminUiString,
  restoreAdminUiString,
  type UiStringCreateInput,
  type UiStringUpdateInput,
} from "@/services/uiStrings";

/** Create a UI string. Invalidates the list. */
export function useCreateUiString() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UiStringCreateInput) => createAdminUiString(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.uiStrings.lists() });
    },
  });
}

/** Update a UI string. Invalidates list + detail. */
export function useUpdateUiString() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UiStringUpdateInput }) =>
      updateAdminUiString(id, payload),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.uiStrings.lists() });
      void qc.invalidateQueries({ queryKey: queryKeys.uiStrings.detail(id) });
    },
  });
}

/** Soft-delete a UI string. Invalidates the list. */
export function useDeleteUiString() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminUiString(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.uiStrings.lists() });
    },
  });
}

/** Restore a soft-deleted UI string. Invalidates the list. */
export function useRestoreUiString() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreAdminUiString(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.uiStrings.lists() });
    },
  });
}
