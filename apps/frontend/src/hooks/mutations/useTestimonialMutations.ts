// src/hooks/mutations/useTestimonialMutations.ts
// React Query WRITE hooks for testimonials. Each mutation calls the testimonials admin
// client service, then invalidates the affected query keys so the list + detail re-fetch.

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query";
import {
  createAdminTestimonial,
  updateAdminTestimonial,
  deleteAdminTestimonial,
  restoreAdminTestimonial,
  type TestimonialCreateInput,
  type TestimonialUpdateInput,
} from "@/services/testimonials/testimonials.admin.client";

/** Create a testimonial. Invalidates the testimonials list. */
export function useCreateTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TestimonialCreateInput) => createAdminTestimonial(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.testimonials.lists() });
    },
  });
}

/** Update a testimonial. Invalidates detail + list. */
export function useUpdateTestimonial(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TestimonialUpdateInput) => updateAdminTestimonial(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.testimonials.detail(id) });
      void qc.invalidateQueries({ queryKey: queryKeys.testimonials.lists() });
    },
  });
}

/** Soft-delete a testimonial. Invalidates list + detail. */
export function useDeleteTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminTestimonial(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.testimonials.lists() });
      void qc.invalidateQueries({ queryKey: queryKeys.testimonials.detail(id) });
    },
  });
}

/** Restore a soft-deleted testimonial. Invalidates list + detail. */
export function useRestoreTestimonial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreAdminTestimonial(id),
    onSuccess: (_data, id) => {
      void qc.invalidateQueries({ queryKey: queryKeys.testimonials.lists() });
      void qc.invalidateQueries({ queryKey: queryKeys.testimonials.detail(id) });
    },
  });
}
