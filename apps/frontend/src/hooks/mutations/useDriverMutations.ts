// src/hooks/mutations/useDriverMutations.ts
// React Query WRITE hooks for drivers. Each mutation calls the drivers admin client,
// then invalidates the affected query keys so the list + detail re-fetch.
// No toast inside the hook — callers keep their try/catch + toast.

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  createAdminDriver,
  updateAdminDriver,
  deleteAdminDriver,
  recordLicenseCheck,
  type DriverInput,
  type LicenseCheckInput,
} from "@/services/drivers/drivers.admin.client";

/** Create a driver. Invalidates the drivers list. */
export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DriverInput) => createAdminDriver(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.lists() });
    },
  });
}

/** Update a driver. Invalidates detail + list. */
export function useUpdateDriver(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<DriverInput>) => updateAdminDriver(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.lists() });
    },
  });
}

/** Soft-delete a driver. Invalidates the drivers list. */
export function useDeleteDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminDriver(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.lists() });
    },
  });
}

/** Record a §21 StVG licence check. Invalidates that driver's detail + the list. */
export function useRecordLicenseCheck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload = {} }: { id: string; payload?: LicenseCheckInput }) =>
      recordLicenseCheck(id, payload),
    onSuccess: (_data, { id }) => {
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.lists() });
    },
  });
}
