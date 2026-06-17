// apps/frontend/src/app/admin/(authed)/vehicles/[id]/_form.tsx
// Vehicle create/edit form with Preview button beside Cancel.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Trash2, RotateCcw, Eye } from "lucide-react";
import { adminVehicleSchema, type AdminVehicleInput } from "@/schemas/admin-vehicle.schema";
import { type VehicleCreateInput } from "@/services/vehicles";
import {
  useCreateVehicle, useUpdateVehicle, useDeleteVehicle, useRestoreVehicle,
} from "@/hooks/mutations/useVehicleMutations";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import {
  AdminCard, AdminFormField, BilingualField, ConfirmDialog, ImageUploadField, PreviewModal,
  adminInputClass,
} from "@/components/admin";
import type { VehicleAdmin } from "@/types";
import { uploadAdminFile } from "@/services/uploads/uploads.admin.client";
import { vehiclesPreviewUrl } from "@/utils/preview-urls";

type Mode = "create" | "edit";
interface VehicleFormProps { mode: Mode; initial?: VehicleAdmin; }

function emptyDefaults(): AdminVehicleInput {
  return {
    sort_order: 0, active: true,
    name_de: "", name_en: "", category: "sedan",
    capacity_passengers: 4, capacity_luggage: 2,
    features_de: "", features_en: "", image_url: "",
  };
}

function fromVehicle(v: VehicleAdmin): AdminVehicleInput {
  return {
    sort_order: v.sort_order ?? 0, active: v.active ?? true,
    name_de: v.name_de, name_en: v.name_en, category: v.category,
    capacity_passengers: v.capacity_passengers, capacity_luggage: v.capacity_luggage,
    features_de: (v.features_de ?? []).join("\n"),
    features_en: (v.features_en ?? []).join("\n"),
    image_url: v.image_url ?? "",
  };
}

function toPayload(values: AdminVehicleInput): VehicleCreateInput {
  const orNull = (v: string | undefined) => (v?.trim() ? v.trim() : null);
  return {
    sort_order: values.sort_order, active: values.active,
    name_de: values.name_de, name_en: values.name_en, category: values.category,
    capacity_passengers: values.capacity_passengers,
    capacity_luggage: values.capacity_luggage,
    features_de: (values.features_de ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    features_en: (values.features_en ?? "").split("\n").map((s) => s.trim()).filter(Boolean),
    image_url: orNull(values.image_url),
  };
}

async function uploadHandler(file: File): Promise<string> {
  const res = await uploadAdminFile(file);
  return res.url;
}

function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p role="alert" className="text-[11px] font-medium text-rose-700">{msg}</p>;
}

export function VehicleForm({ mode, initial }: VehicleFormProps) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle(initial?.id ?? "");
  const deleteVehicle = useDeleteVehicle();
  const restoreVehicle = useRestoreVehicle();

  const {
    register, handleSubmit, reset, control, watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminVehicleInput>({
    resolver: zodResolver(adminVehicleSchema),
    defaultValues: initial ? fromVehicle(initial) : emptyDefaults(),
  });

  const nameDe = watch("name_de");

  async function onSubmit(values: AdminVehicleInput) {
    setServerError(null);
    try {
      if (mode === "create") {
        const created = await createVehicle.mutateAsync(toPayload(values));
        pushToast("success", "Vehicle created", created.name_de);
        router.push(`/admin/vehicles/${created.id}`);
        router.refresh();
      } else if (initial) {
        const updated = await updateVehicle.mutateAsync(toPayload(values));
        reset(fromVehicle(updated));
        pushToast("success", "Vehicle saved");
        router.refresh();
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Network error";
      setServerError(msg);
      pushToast("error", "Save failed", msg);
    }
  }

  async function onDelete() {
    if (!initial) return;
    setBusy(true);
    try {
      await deleteVehicle.mutateAsync(initial.id);
      pushToast("success", "Vehicle deleted", "Soft-deleted; you can restore it.");
      router.push("/admin/vehicles");
      router.refresh();
    } catch (err) {
      pushToast("error", "Delete failed", err instanceof ApiError ? err.message : "Network error");
      setBusy(false);
    }
  }

  async function onRestore() {
    if (!initial) return;
    setBusy(true);
    try {
      const restored = await restoreVehicle.mutateAsync(initial.id);
      reset(fromVehicle(restored));
      pushToast("success", "Vehicle restored");
      router.refresh();
    } catch (err) {
      pushToast("error", "Restore failed", err instanceof ApiError ? err.message : "Network error");
    } finally { setBusy(false); }
  }

  const isDeleted = initial?.is_deleted ?? false;
  const canPreview = mode === "edit" && initial && !isDeleted && initial.active;
  const previewUrl = canPreview ? vehiclesPreviewUrl() : "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
        <p className="text-[12px] text-slate-500">
          {isDeleted
            ? "This vehicle is deleted. Restore it to make it editable."
            : isDirty
              ? "You have unsaved changes."
              : mode === "create"
                ? "Fill in the form to create a new vehicle."
                : "All changes saved."}
        </p>
        <div className="flex items-center gap-2">
          <Link href="/admin/vehicles" className="flex h-9 items-center border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-100">
            Cancel
          </Link>
          {canPreview && (
            <button type="button" onClick={() => setPreviewOpen(true)}
              className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50">
              <Eye className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              Preview
            </button>
          )}
          {mode === "edit" && initial && isDeleted && (
            <button type="button" onClick={onRestore} disabled={busy}
              className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50">
              <RotateCcw className="h-3.5 w-3.5" /> Restore
            </button>
          )}
          {mode === "edit" && initial && !isDeleted && (
            <button type="button" onClick={() => setConfirmDelete(true)} disabled={busy}
              className="flex h-9 items-center gap-1.5 border border-red-200 bg-white px-3 text-[13px] font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
          <button type="submit" disabled={isSubmitting || (mode === "edit" && !isDirty) || isDeleted}
            className="flex h-9 items-center gap-2 bg-slate-900 px-4 text-[13px] font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {mode === "create" ? "Create" : "Save changes"}
          </button>
        </div>
      </div>

      {serverError && (
        <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{serverError}</div>
      )}

      <AdminCard title="Identity">
        <div className="flex flex-col gap-4">
          <BilingualField
            label="Name"
            required
            de={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} {...register("name_de")} disabled={isDeleted} aria-invalid={errors.name_de ? true : undefined} />
                <FieldErr msg={errors.name_de?.message} />
              </div>
            }
            en={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} {...register("name_en")} disabled={isDeleted} aria-invalid={errors.name_en ? true : undefined} />
                <FieldErr msg={errors.name_en?.message} />
              </div>
            }
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <AdminFormField label="Category" required error={errors.category?.message}>
              <input placeholder="sedan, van, minibus…" className={adminInputClass} {...register("category")} disabled={isDeleted} />
            </AdminFormField>
            <AdminFormField label="Passenger capacity" required error={errors.capacity_passengers?.message}>
              <input type="number" min="1" max="50" className={adminInputClass} {...register("capacity_passengers")} disabled={isDeleted} />
            </AdminFormField>
            <AdminFormField label="Luggage capacity" error={errors.capacity_luggage?.message}>
              <input type="number" min="0" max="50" className={adminInputClass} {...register("capacity_luggage")} disabled={isDeleted} />
            </AdminFormField>
            <AdminFormField label="Sort order" error={errors.sort_order?.message}>
              <input type="number" min="0" className={adminInputClass} {...register("sort_order")} disabled={isDeleted} />
            </AdminFormField>
          </div>
          <AdminFormField label="Active">
            <label className="flex h-8 items-center gap-2 text-[13px] text-slate-700">
              <input type="checkbox" className="h-3.5 w-3.5" {...register("active")} disabled={isDeleted} />
              Show on public site
            </label>
          </AdminFormField>
        </div>
      </AdminCard>

      <AdminCard title="Features" description="One feature per line.">
        <BilingualField
          label="Features"
          de={
            <div className="flex flex-col gap-1">
              <textarea
                rows={6}
                placeholder={"Klimaanlage\nLederausstattung\nWi-Fi"}
                className="w-full border border-slate-300 bg-white px-2.5 py-2 text-[13px] text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50"
                {...register("features_de")}
                disabled={isDeleted}
                aria-invalid={errors.features_de ? true : undefined}
              />
              <FieldErr msg={errors.features_de?.message} />
            </div>
          }
          en={
            <div className="flex flex-col gap-1">
              <textarea
                rows={6}
                placeholder={"Air conditioning\nLeather seats\nWi-Fi"}
                className="w-full border border-slate-300 bg-white px-2.5 py-2 text-[13px] text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:bg-slate-50"
                {...register("features_en")}
                disabled={isDeleted}
                aria-invalid={errors.features_en ? true : undefined}
              />
              <FieldErr msg={errors.features_en?.message} />
            </div>
          }
        />
      </AdminCard>

      <AdminCard title="Media" description="Upload a vehicle photo.">
        <AdminFormField label="Vehicle image" error={errors.image_url?.message}>
          <Controller
            name="image_url"
            control={control}
            render={({ field }) => (
              <ImageUploadField
                label=""
                value={field.value ? field.value : null}
                onChange={(next) => field.onChange(next ?? "")}
                onUpload={uploadHandler}
              />
            )}
          />
        </AdminFormField>
      </AdminCard>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this vehicle?"
        description="It will be soft-deleted and hidden from the public site. You can restore it any time."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => { setConfirmDelete(false); void onDelete(); }}
        onCancel={() => setConfirmDelete(false)}
      />

      {canPreview && (
        <PreviewModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          url={previewUrl}
          title={nameDe || initial?.name_de}
          subtitle={previewUrl}
        />
      )}
    </form>
  );
}
