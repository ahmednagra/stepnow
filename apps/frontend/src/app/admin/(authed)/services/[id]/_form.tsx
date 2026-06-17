// apps/frontend/src/app/admin/(authed)/services/[id]/_form.tsx
// Service create/edit form with Preview button beside Cancel.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Trash2, RotateCcw, Eye } from "lucide-react";
import { adminServiceSchema, type AdminServiceInput } from "@/schemas/admin-service.schema";
import { type ServiceCreateInput } from "@/services/services";
import {
  useCreateService, useUpdateService, useDeleteService, useRestoreService,
} from "@/hooks/mutations/useServiceMutations";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import {
  AdminCard, AdminFormField, BilingualField, ConfirmDialog, ImageUploadField, PreviewModal,
  adminInputClass, adminTextareaClass,
} from "@/components/admin";
import type { ServiceAdmin } from "@/types";
import { uploadAdminFile } from "@/services/uploads/uploads.admin.client";
import { servicePreviewUrl } from "@/utils/preview-urls";

type Mode = "create" | "edit";
interface ServiceFormProps { mode: Mode; initial?: ServiceAdmin; }

function emptyDefaults(): AdminServiceInput {
  return {
    sort_order: 0, active: true, icon: "",
    slug_de: "", slug_en: "", title_de: "", title_en: "",
    short_description_de: "", short_description_en: "",
    long_description_de: "", long_description_en: "",
    hero_image_url: "", og_image_url: "",
    meta_title_de: "", meta_title_en: "",
    meta_description_de: "", meta_description_en: "",
  };
}

function fromService(s: ServiceAdmin): AdminServiceInput {
  return {
    sort_order: s.sort_order ?? 0, active: s.active ?? true, icon: s.icon ?? "",
    slug_de: s.slug_de, slug_en: s.slug_en,
    title_de: s.title_de, title_en: s.title_en,
    short_description_de: s.short_description_de ?? "", short_description_en: s.short_description_en ?? "",
    long_description_de: s.long_description_de ?? "", long_description_en: s.long_description_en ?? "",
    hero_image_url: s.hero_image_url ?? "", og_image_url: s.og_image_url ?? "",
    meta_title_de: s.meta_title_de ?? "", meta_title_en: s.meta_title_en ?? "",
    meta_description_de: s.meta_description_de ?? "", meta_description_en: s.meta_description_en ?? "",
  };
}

function toPayload(values: AdminServiceInput): ServiceCreateInput {
  const orNull = (v: string | undefined) => (v?.trim() ? v.trim() : null);
  return {
    sort_order: values.sort_order, active: values.active, icon: orNull(values.icon),
    slug_de: values.slug_de, slug_en: values.slug_en,
    title_de: values.title_de, title_en: values.title_en,
    short_description_de: orNull(values.short_description_de),
    short_description_en: orNull(values.short_description_en),
    long_description_de: orNull(values.long_description_de),
    long_description_en: orNull(values.long_description_en),
    hero_image_url: orNull(values.hero_image_url),
    og_image_url: orNull(values.og_image_url),
    meta_title_de: orNull(values.meta_title_de),
    meta_title_en: orNull(values.meta_title_en),
    meta_description_de: orNull(values.meta_description_de),
    meta_description_en: orNull(values.meta_description_en),
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

export function ServiceForm({ mode, initial }: ServiceFormProps) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const createService = useCreateService();
  const updateService = useUpdateService(initial?.id ?? "");
  const deleteService = useDeleteService();
  const restoreService = useRestoreService();

  const {
    register, handleSubmit, reset, control, watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminServiceInput>({
    resolver: zodResolver(adminServiceSchema),
    defaultValues: initial ? fromService(initial) : emptyDefaults(),
  });

  const titleDe = watch("title_de");
  const slugDe = watch("slug_de");
  const slugEn = watch("slug_en");

  async function onSubmit(values: AdminServiceInput) {
    setServerError(null);
    try {
      if (mode === "create") {
        const created = await createService.mutateAsync(toPayload(values));
        pushToast("success", "Service created", created.title_de);
        router.push(`/admin/services/${created.id}`);
        router.refresh();
      } else if (initial) {
        const updated = await updateService.mutateAsync(toPayload(values));
        reset(fromService(updated));
        pushToast("success", "Service saved");
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
      await deleteService.mutateAsync(initial.id);
      pushToast("success", "Service deleted", "Soft-deleted; you can restore it.");
      router.push("/admin/services");
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
      const restored = await restoreService.mutateAsync(initial.id);
      reset(fromService(restored));
      pushToast("success", "Service restored");
      router.refresh();
    } catch (err) {
      pushToast("error", "Restore failed", err instanceof ApiError ? err.message : "Network error");
    } finally { setBusy(false); }
  }

  const isDeleted = initial?.is_deleted ?? false;
  const canPreview = mode === "edit" && initial && !isDeleted && initial.active && slugDe;
  const previewUrl = canPreview ? servicePreviewUrl(slugDe, slugEn) : "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
        <p className="text-[12px] text-slate-500">
          {isDeleted
            ? "This service is deleted. Restore it to make it editable."
            : isDirty
              ? "You have unsaved changes."
              : mode === "create"
                ? "Fill in the form to create a new service."
                : "All changes saved."}
        </p>
        <div className="flex items-center gap-2">
          <Link href="/admin/services" className="flex h-9 items-center border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-100">
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
            label="Title"
            required
            de={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} {...register("title_de")} disabled={isDeleted} aria-invalid={errors.title_de ? true : undefined} />
                <FieldErr msg={errors.title_de?.message} />
              </div>
            }
            en={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} {...register("title_en")} disabled={isDeleted} aria-invalid={errors.title_en ? true : undefined} />
                <FieldErr msg={errors.title_en?.message} />
              </div>
            }
          />
          <BilingualField
            label="Slug"
            required
            hint="Used in the public URL: /dienstleistungen/{slug-de} and /en/services/{slug-en}"
            de={
              <div className="flex flex-col gap-1">
                <input className={`${adminInputClass} font-mono`} {...register("slug_de")} disabled={isDeleted} aria-invalid={errors.slug_de ? true : undefined} />
                <FieldErr msg={errors.slug_de?.message} />
              </div>
            }
            en={
              <div className="flex flex-col gap-1">
                <input className={`${adminInputClass} font-mono`} {...register("slug_en")} disabled={isDeleted} aria-invalid={errors.slug_en ? true : undefined} />
                <FieldErr msg={errors.slug_en?.message} />
              </div>
            }
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <AdminFormField label="Icon" hint="lucide name" error={errors.icon?.message}>
              <input placeholder="plane, car, heart-pulse…" className={adminInputClass} {...register("icon")} disabled={isDeleted} />
            </AdminFormField>
            <AdminFormField label="Sort order" error={errors.sort_order?.message}>
              <input type="number" min="0" className={adminInputClass} {...register("sort_order")} disabled={isDeleted} />
            </AdminFormField>
            <AdminFormField label="Active">
              <label className="flex h-8 items-center gap-2 text-[13px] text-slate-700">
                <input type="checkbox" className="h-3.5 w-3.5" {...register("active")} disabled={isDeleted} />
                Show on public site
              </label>
            </AdminFormField>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="Description">
        <div className="flex flex-col gap-4">
          <BilingualField
            label="Short description"
            hint="One-paragraph teaser shown on service cards."
            de={
              <div className="flex flex-col gap-1">
                <textarea rows={3} className={adminTextareaClass} {...register("short_description_de")} disabled={isDeleted} aria-invalid={errors.short_description_de ? true : undefined} />
                <FieldErr msg={errors.short_description_de?.message} />
              </div>
            }
            en={
              <div className="flex flex-col gap-1">
                <textarea rows={3} className={adminTextareaClass} {...register("short_description_en")} disabled={isDeleted} aria-invalid={errors.short_description_en ? true : undefined} />
                <FieldErr msg={errors.short_description_en?.message} />
              </div>
            }
          />
          <BilingualField
            label="Long description"
            hint="Markdown supported. Shown on the service detail page."
            de={
              <div className="flex flex-col gap-1">
                <textarea rows={8} className={`${adminTextareaClass} font-mono text-[12px]`} {...register("long_description_de")} disabled={isDeleted} aria-invalid={errors.long_description_de ? true : undefined} />
                <FieldErr msg={errors.long_description_de?.message} />
              </div>
            }
            en={
              <div className="flex flex-col gap-1">
                <textarea rows={8} className={`${adminTextareaClass} font-mono text-[12px]`} {...register("long_description_en")} disabled={isDeleted} aria-invalid={errors.long_description_en ? true : undefined} />
                <FieldErr msg={errors.long_description_en?.message} />
              </div>
            }
          />
        </div>
      </AdminCard>

      <AdminCard title="Media" description="Upload a file or remove it. Files are stored locally and served by nginx in production.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AdminFormField label="Hero image" error={errors.hero_image_url?.message}>
            <Controller
              name="hero_image_url"
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
          <AdminFormField label="OG image" hint="Used for link previews on social media." error={errors.og_image_url?.message}>
            <Controller
              name="og_image_url"
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
        </div>
      </AdminCard>

      <AdminCard title="SEO" description="Per-service overrides for meta title and description.">
        <div className="flex flex-col gap-4">
          <BilingualField
            label="Meta title"
            hint="Falls back to the page title."
            de={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} {...register("meta_title_de")} disabled={isDeleted} aria-invalid={errors.meta_title_de ? true : undefined} />
                <FieldErr msg={errors.meta_title_de?.message} />
              </div>
            }
            en={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} {...register("meta_title_en")} disabled={isDeleted} aria-invalid={errors.meta_title_en ? true : undefined} />
                <FieldErr msg={errors.meta_title_en?.message} />
              </div>
            }
          />
          <BilingualField
            label="Meta description"
            hint="Falls back to the short description."
            de={
              <div className="flex flex-col gap-1">
                <textarea rows={2} className={adminTextareaClass} {...register("meta_description_de")} disabled={isDeleted} aria-invalid={errors.meta_description_de ? true : undefined} />
                <FieldErr msg={errors.meta_description_de?.message} />
              </div>
            }
            en={
              <div className="flex flex-col gap-1">
                <textarea rows={2} className={adminTextareaClass} {...register("meta_description_en")} disabled={isDeleted} aria-invalid={errors.meta_description_en ? true : undefined} />
                <FieldErr msg={errors.meta_description_en?.message} />
              </div>
            }
          />
        </div>
      </AdminCard>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this service?"
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
          title={titleDe || initial?.title_de}
          subtitle={previewUrl}
        />
      )}
    </form>
  );
}
