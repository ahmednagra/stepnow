// src/hooks/mutations/usePricingMutations.ts
// React Query WRITE hooks for pricing (categories + items). Pricing lives under a service, so
// every mutation invalidates that service's pricing-categories list (and detail). Each mutation
// calls the existing pricing admin client service.

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  createAdminPricingCategory,
  updateAdminPricingCategory,
  deleteAdminPricingCategory,
  restoreAdminPricingCategory,
  createAdminPricingItem,
  updateAdminPricingItem,
  deleteAdminPricingItem,
  restoreAdminPricingItem,
  type PricingCategoryCreateInput,
  type PricingCategoryUpdateInput,
  type PricingItemCreateInput,
  type PricingItemUpdateInput,
} from "@/services/pricing";

function invalidateService(qc: ReturnType<typeof useQueryClient>, serviceId: string) {
  void qc.invalidateQueries({ queryKey: queryKeys.services.pricingCategories(serviceId) });
  void qc.invalidateQueries({ queryKey: queryKeys.services.detail(serviceId) });
}

// ---------- Categories ----------

/** Create a pricing category under a service. */
export function useCreatePricingCategory(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PricingCategoryCreateInput) =>
      createAdminPricingCategory(serviceId, payload),
    onSuccess: () => invalidateService(qc, serviceId),
  });
}

/** Update a pricing category. */
export function useUpdatePricingCategory(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, payload }: { categoryId: string; payload: PricingCategoryUpdateInput }) =>
      updateAdminPricingCategory(categoryId, payload),
    onSuccess: () => invalidateService(qc, serviceId),
  });
}

/** Soft-delete a pricing category. */
export function useDeletePricingCategory(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => deleteAdminPricingCategory(categoryId),
    onSuccess: () => invalidateService(qc, serviceId),
  });
}

/** Restore a soft-deleted pricing category. */
export function useRestorePricingCategory(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (categoryId: string) => restoreAdminPricingCategory(categoryId),
    onSuccess: () => invalidateService(qc, serviceId),
  });
}

// ---------- Items ----------

/** Create a pricing item inside a category. */
export function useCreatePricingItem(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, payload }: { categoryId: string; payload: PricingItemCreateInput }) =>
      createAdminPricingItem(categoryId, payload),
    onSuccess: () => invalidateService(qc, serviceId),
  });
}

/** Update a pricing item. */
export function useUpdatePricingItem(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: PricingItemUpdateInput }) =>
      updateAdminPricingItem(itemId, payload),
    onSuccess: () => invalidateService(qc, serviceId),
  });
}

/** Soft-delete a pricing item. */
export function useDeletePricingItem(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => deleteAdminPricingItem(itemId),
    onSuccess: () => invalidateService(qc, serviceId),
  });
}

/** Restore a soft-deleted pricing item. */
export function useRestorePricingItem(serviceId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => restoreAdminPricingItem(itemId),
    onSuccess: () => invalidateService(qc, serviceId),
  });
}
