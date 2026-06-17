// apps/frontend/src/app/admin/(authed)/pricing/[serviceId]/_item_modal.tsx
// Modal to create or edit a pricing item (route + price) inside a category.

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2 } from "lucide-react";
import {
  adminPricingItemSchema,
  type AdminPricingItemInput,
} from "@/schemas/admin-pricing.schema";
import {
  useCreatePricingItem,
  useUpdatePricingItem,
} from "@/hooks/mutations/usePricingMutations";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import {
  AdminFormField,
  BilingualField,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin";
import { normalizeDecimalInput, formatDecimalForInput } from "@/utils/decimal";
import type { PricingItemAdmin } from "@/types";

interface ItemModalProps {
  mode: "create" | "edit";
  serviceId: string;
  categoryId: string;
  item?: PricingItemAdmin;
  nextSortOrder: number;
  onClose: () => void;
  onSaved: (item: PricingItemAdmin) => void;
}

function defaults(it: PricingItemAdmin | undefined, nextSortOrder: number): AdminPricingItemInput {
  return {
    sort_order: it?.sort_order ?? nextSortOrder,
    from_location_de: it?.from_location_de ?? "",
    from_location_en: it?.from_location_en ?? "",
    to_location_de: it?.to_location_de ?? "",
    to_location_en: it?.to_location_en ?? "",
    price_eur: formatDecimalForInput(it?.price_eur),
    note_de: it?.note_de ?? "",
    note_en: it?.note_en ?? "",
  };
}

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p role="alert" className="text-[11px] font-medium text-rose-700">{msg}</p>;
}

export function ItemModal({
  mode, serviceId, categoryId, item, nextSortOrder, onClose, onSaved,
}: ItemModalProps) {
  const pushToast = useAdminToast((s) => s.push);
  const [serverError, setServerError] = useState<string | null>(null);
  const createItem = useCreatePricingItem(serviceId);
  const updateItem = useUpdatePricingItem(serviceId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminPricingItemInput>({
    resolver: zodResolver(adminPricingItemSchema),
    defaultValues: defaults(item, nextSortOrder),
  });

  async function onSubmit(values: AdminPricingItemInput) {
    setServerError(null);
    const normalizedPrice = normalizeDecimalInput(values.price_eur);
    if (!normalizedPrice) {
      setServerError("Enter a valid price.");
      return;
    }
    const orNull = (v: string | undefined) => (v?.trim() ? v.trim() : null);
    const payload = {
      sort_order: values.sort_order,
      from_location_de: orNull(values.from_location_de),
      from_location_en: orNull(values.from_location_en),
      to_location_de: orNull(values.to_location_de),
      to_location_en: orNull(values.to_location_en),
      price_eur: normalizedPrice,
      note_de: orNull(values.note_de),
      note_en: orNull(values.note_en),
    };

    try {
      const saved =
        mode === "create"
          ? await createItem.mutateAsync({ categoryId, payload })
          : await updateItem.mutateAsync({ itemId: item!.id, payload });
      onSaved(saved);
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
        className="w-full max-w-2xl border border-slate-200 bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-900">
            {mode === "create" ? "New pricing item" : "Edit pricing item"}
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
            label="From"
            hint="e.g. Stuttgart Hbf, Flughafen Stuttgart"
            de={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} {...register("from_location_de")} aria-invalid={errors.from_location_de ? true : undefined} />
                <FieldErr msg={errors.from_location_de?.message} />
              </div>
            }
            en={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} {...register("from_location_en")} aria-invalid={errors.from_location_en ? true : undefined} />
                <FieldErr msg={errors.from_location_en?.message} />
              </div>
            }
          />

          <BilingualField
            label="To"
            de={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} {...register("to_location_de")} aria-invalid={errors.to_location_de ? true : undefined} />
                <FieldErr msg={errors.to_location_de?.message} />
              </div>
            }
            en={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} {...register("to_location_en")} aria-invalid={errors.to_location_en ? true : undefined} />
                <FieldErr msg={errors.to_location_en?.message} />
              </div>
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <AdminFormField
              label="Price (EUR)"
              required
              error={errors.price_eur?.message}
              hint="e.g. 45.50 or 45,50"
            >
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                className={`${adminInputClass} tabular-nums`}
                {...register("price_eur")}
              />
            </AdminFormField>
            <AdminFormField label="Sort order" error={errors.sort_order?.message} hint="optional">
              <input type="number" min="0" className={adminInputClass} {...register("sort_order")} />
            </AdminFormField>
          </div>

          <BilingualField
            label="Note"
            hint="Optional. Shown next to the price (e.g. 'incl. waiting time')."
            de={
              <div className="flex flex-col gap-1">
                <textarea rows={2} className={adminTextareaClass} {...register("note_de")} aria-invalid={errors.note_de ? true : undefined} />
                <FieldErr msg={errors.note_de?.message} />
              </div>
            }
            en={
              <div className="flex flex-col gap-1">
                <textarea rows={2} className={adminTextareaClass} {...register("note_en")} aria-invalid={errors.note_en ? true : undefined} />
                <FieldErr msg={errors.note_en?.message} />
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
              {mode === "create" ? "Create item" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
