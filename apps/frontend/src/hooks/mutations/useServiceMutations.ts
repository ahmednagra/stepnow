// src/hooks/mutations/useServiceMutations.ts
// React Query WRITE hooks for services. Each mutation calls the services admin client
// service, then invalidates the affected query keys so the list + detail re-fetch.

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  createAdminService,
  updateAdminService,
  deleteAdminService,
  restoreAdminService,
  type ServiceCreateInput,
  type ServiceUpdateInput,
} from "@/services/services/services.admin.client";

/** Create a service. Invalidates the services list. */
export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServiceCreateInput) => createAdminService(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.services.lists() });
    },
  });
}

/** Update a service. Invalidates detail + list. */
export function useUpdateService(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServiceUpdateInput) => updateAdminService(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.services.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.services.lists() });
    },
  });
}

/** Soft-delete a service. Invalidates list + detail. */
export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminService(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.services.lists() });
      void qc.invalidateQueries({ queryKey: queryKeys.services.detail(id) });
    },
  });
}

/** Restore a soft-deleted service. Invalidates list + detail. */
export function useRestoreService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreAdminService(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.services.lists() });
      void qc.invalidateQueries({ queryKey: queryKeys.services.detail(id) });
    },
  });
}
