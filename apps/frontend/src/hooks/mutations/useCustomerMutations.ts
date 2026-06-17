// src/hooks/mutations/useCustomerMutations.ts
// React Query WRITE hooks for customers. Each mutation calls the customers admin client,
// then invalidates the affected query keys so the list + detail re-fetch.
// No toast inside the hook — callers keep their try/catch + toast.

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  createAdminCustomer,
  updateAdminCustomer,
  deleteAdminCustomer,
  type CustomerInput,
} from "@/services/customers/customers.admin.client";

/** Create a customer. Invalidates the customers list. */
export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CustomerInput) => createAdminCustomer(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });
}

/** Update a customer. Invalidates detail + list. */
export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<CustomerInput>) => updateAdminCustomer(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.customers.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });
}

/** Soft-delete a customer. Invalidates the customers list. */
export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminCustomer(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });
}
