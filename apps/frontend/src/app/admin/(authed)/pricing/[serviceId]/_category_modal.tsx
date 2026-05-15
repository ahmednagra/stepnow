// apps/frontend/src/app/admin/(authed)/pricing/[serviceId]/_category_modal.tsx
// Modal to create or edit a pricing category for a service.

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import {
  adminPricingCategorySchema,
  type AdminPricingCategoryInput,
} from "@/schemas/admin-pricing.schema";
import {
  createAdminPricingCategory,
  updateAdminPricingCategory,
} from "@/services/pricing";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import {
  BilingualField,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin";
import type { PricingCategoryAdmin } from "@/types";

interface CategoryModalProps {
  serviceId: string;
  mode: "create" | "edit";
  category?: PricingCategoryAdmin;
  nextSortOrder: number;
  onClose: () => void;
  onSaved: (cat: PricingCategoryAdmin) => void;
}

function defaults(c: PricingCategoryAdmin | undefined, nextSortOrder: number): AdminPricingCategoryInput {
  return {
    sort_order: c?.sort_order ?? nextSortOrder,
    name_de: c?.name_de ?? "",
    name_en: c?.name_en ?? "",
    description_de: c?.description_de ?? "",
    description_en: c?.description_en ?? "",
  };
}

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p role="alert" className="text-[11px] font-medium text-rose-700">{msg}</p>;
}

export function CategoryModal({
  serviceId, mode, category, nextSortOrder, onClose, onSaved,
}: CategoryModalProps) {
  const pushToast = useAdminToast((s) => s.push);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminPricingCategoryInput>({
    resolver: zodResolver(adminPricingCategorySchema),
    defaultValues: defaults(category, nextSortOrder),
  });

  async function onSubmit(values: AdminPricingCategoryInput) {
    setServerError(null);
    const payload = {
      sort_order: values.sort_order,
      name_de: values.name_de,
      name_en: values.name_en,
      description_de: values.description_de?.trim() || null,
      description_en: values.description_en?.trim() || null,
    };
    try {
      const saved =
        mode === "create"
          ? await createAdminPricingCategory(serviceId, payload)
          : await updateAdminPricingCategory(category!.id, payload);
      const withItems: PricingCategoryAdmin = {
        ...saved,
        items: (saved as PricingCategoryAdmin).items ?? category?.items ?? [],
      };
      onSaved(withItems);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Network error";
      setServerError(msg);
      pushToast("error", "Save failed", msg);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl border border-slate-200 bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            {mode === "create" ? "New pricing category" : "Edit pricing category"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 hover:text-slate-900"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-5">
          {serverError && (
            <div role="alert" className="border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {serverError}
            </div>
          )}

          <BilingualField
            label="Name"
            required
            de={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} {...register("name_de")} aria-invalid={errors.name_de ? true : undefined} />
                <FieldErr msg={errors.name_de?.message} />
              </div>
            }
            en={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} {...register("name_en")} aria-invalid={errors.name_en ? true : undefined} />
                <FieldErr msg={errors.name_en?.message} />
              </div>
            }
          />

          <BilingualField
            label="Description"
            hint="Optional. Shown above the items on the public pricing page."
            de={
              <div className="flex flex-col gap-1">
                <textarea rows={2} className={adminTextareaClass} {...register("description_de")} aria-invalid={errors.description_de ? true : undefined} />
                <FieldErr msg={errors.description_de?.message} />
              </div>
            }
            en={
              <div className="flex flex-col gap-1">
                <textarea rows={2} className={adminTextareaClass} {...register("description_en")} aria-invalid={errors.description_en ? true : undefined} />
                <FieldErr msg={errors.description_en?.message} />
              </div>
            }
          />

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 items-center border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-9 items-center gap-2 bg-slate-900 px-4 text-[13px] font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {mode === "create" ? "Create category" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
