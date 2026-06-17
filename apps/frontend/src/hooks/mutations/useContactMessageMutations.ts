// src/hooks/mutations/useContactMessageMutations.ts
// React Query WRITE hooks for contact messages. Each mutation calls the existing contact
// client service, then invalidates the affected query keys so the list + detail re-fetch.

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  updateAdminContactMessage,
  deleteAdminContactMessage,
  type ContactMessageUpdateInput,
} from "@/services/contact";

/** Update a contact message (handled flag / notes). Invalidates list (+ detail when id known). */
export function useUpdateContactMessage(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id: messageId, payload }: { id: string; payload: ContactMessageUpdateInput }) =>
      updateAdminContactMessage(messageId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.contactMessages.lists() });
      if (id) void qc.invalidateQueries({ queryKey: queryKeys.contactMessages.detail(id) });
    },
  });
}

/** Soft-delete a contact message. Invalidates list + detail. */
export function useDeleteContactMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminContactMessage(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.contactMessages.lists() });
      void qc.invalidateQueries({ queryKey: queryKeys.contactMessages.detail(id) });
    },
  });
}
