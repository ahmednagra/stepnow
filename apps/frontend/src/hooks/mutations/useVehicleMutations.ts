// src/hooks/mutations/useVehicleMutations.ts
// React Query WRITE hooks for vehicles. Each mutation calls the vehicles admin client
// service, then invalidates the affected query keys so the list + detail re-fetch.

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  createAdminVehicle,
  updateAdminVehicle,
  deleteAdminVehicle,
  restoreAdminVehicle,
  type VehicleCreateInput,
  type VehicleUpdateInput,
} from "@/services/vehicles/vehicles.admin.client";

/** Create a vehicle. Invalidates the vehicles list. */
export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VehicleCreateInput) => createAdminVehicle(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.vehicles.lists() });
    },
  });
}

/** Update a vehicle. Invalidates detail + list. */
export function useUpdateVehicle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VehicleUpdateInput) => updateAdminVehicle(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.vehicles.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.vehicles.lists() });
    },
  });
}

/** Soft-delete a vehicle. Invalidates list + detail. */
export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminVehicle(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.vehicles.lists() });
      void qc.invalidateQueries({ queryKey: queryKeys.vehicles.detail(id) });
    },
  });
}

/** Restore a soft-deleted vehicle. Invalidates list + detail. */
export function useRestoreVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreAdminVehicle(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.vehicles.lists() });
      void qc.invalidateQueries({ queryKey: queryKeys.vehicles.detail(id) });
    },
  });
}
