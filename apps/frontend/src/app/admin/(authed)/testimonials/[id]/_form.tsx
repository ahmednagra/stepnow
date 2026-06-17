// apps/frontend/src/app/admin/(authed)/testimonials/[id]/_form.tsx
// Testimonial create/edit form — compact single-column layout.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Trash2, RotateCcw, Eye } from "lucide-react";
import { adminTestimonialSchema, type AdminTestimonialInput } from "@/schemas/admin-testimonial.schema";
import { type TestimonialCreateInput } from "@/services/testimonials";
import {
  useCreateTestimonial, useUpdateTestimonial, useDeleteTestimonial, useRestoreTestimonial,
} from "@/hooks/mutations/useTestimonialMutations";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import {
  AdminCard, AdminFormField, BilingualField, ConfirmDialog, ImageUploadField, PreviewModal,
  adminInputClass, adminTextareaClass,
} from "@/components/admin";
import type { TestimonialAdmin } from "@/types";
import { uploadAdminFile } from "@/services/uploads/uploads.admin.client";
import { testimonialsPreviewUrl } from "@/utils/preview-urls";

type Mode = "create" | "edit";
interface TestimonialFormProps { mode: Mode; initial?: TestimonialAdmin; }

function emptyDefaults(): AdminTestimonialInput {
  return {
    sort_order: 0, active: true, source: "manual",
    author_name: "", author_role_de: "", author_role_en: "", author_photo_url: "",
    quote_de: "", quote_en: "",
    rating: undefined, date_given: "",
  };
}

function fromTestimonial(t: TestimonialAdmin): AdminTestimonialInput {
  return {
    sort_order: t.sort_order ?? 0, active: t.active ?? true, source: t.source ?? "manual",
    author_name: t.author_name,
    author_role_de: t.author_role_de ?? "", author_role_en: t.author_role_en ?? "",
    author_photo_url: t.author_photo_url ?? "",
    quote_de: t.quote_de, quote_en: t.quote_en,
    rating: t.rating ?? undefined, date_given: t.date_given ?? "",
  };
}

function toPayload(values: AdminTestimonialInput): TestimonialCreateInput {
  const orNull = (v: string | undefined) => (v?.trim() ? v.trim() : null);
  return {
    sort_order: values.sort_order, active: values.active, source: values.source,
    author_name: values.author_name,
    author_role_de: orNull(values.author_role_de),
    author_role_en: orNull(values.author_role_en),
    author_photo_url: orNull(values.author_photo_url),
    quote_de: values.quote_de, quote_en: values.quote_en,
    rating: typeof values.rating === "number" ? values.rating : null,
    date_given: orNull(values.date_given),
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

export function TestimonialForm({ mode, initial }: TestimonialFormProps) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const createTestimonial = useCreateTestimonial();
  const updateTestimonial = useUpdateTestimonial(initial?.id ?? "");
  const deleteTestimonial = useDeleteTestimonial();
  const restoreTestimonial = useRestoreTestimonial();

  const {
    register, handleSubmit, reset, control, watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminTestimonialInput>({
    resolver: zodResolver(adminTestimonialSchema),
    defaultValues: initial ? fromTestimonial(initial) : emptyDefaults(),
  });

  const authorName = watch("author_name");

  async function onSubmit(values: AdminTestimonialInput) {
    setServerError(null);
    try {
      if (mode === "create") {
        const created = await createTestimonial.mutateAsync(toPayload(values));
        pushToast("success", "Testimonial created", created.author_name);
        router.push(`/admin/testimonials/${created.id}`);
        router.refresh();
      } else if (initial) {
        const updated = await updateTestimonial.mutateAsync(toPayload(values));
        reset(fromTestimonial(updated));
        pushToast("success", "Testimonial saved");
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
      await deleteTestimonial.mutateAsync(initial.id);
      pushToast("success", "Testimonial deleted");
      router.push("/admin/testimonials");
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
      const restored = await restoreTestimonial.mutateAsync(initial.id);
      reset(fromTestimonial(restored));
      pushToast("success", "Testimonial restored");
      router.refresh();
    } catch (err) {
      pushToast("error", "Restore failed", err instanceof ApiError ? err.message : "Network error");
    } finally { setBusy(false); }
  }

  const isDeleted = initial?.is_deleted ?? false;
  const canPreview = mode === "edit" && initial && !isDeleted && initial.active;
  const previewUrl = canPreview ? testimonialsPreviewUrl() : "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
        <p className="text-[12px] text-slate-500">
          {isDeleted
            ? "This testimonial is deleted. Restore it to make it editable."
            : isDirty
              ? "You have unsaved changes."
              : mode === "create"
                ? "Fill in the form to create a new testimonial."
                : "All changes saved."}
        </p>
        <div className="flex items-center gap-2">
          <Link href="/admin/testimonials" className="flex h-9 items-center border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-100">
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

      <AdminCard title="Author" description="DSGVO: prefer initials or first-name-only unless you have written consent.">
        <div className="flex flex-col gap-4">
          <AdminFormField label="Author name" required error={errors.author_name?.message}>
            <input className={adminInputClass} {...register("author_name")} disabled={isDeleted} />
          </AdminFormField>
          <AdminFormField label="Source" required error={errors.source?.message} hint="e.g. manual, google, trustpilot">
            <input className={adminInputClass} {...register("source")} disabled={isDeleted} />
          </AdminFormField>
          <BilingualField
            label="Author role"
            de={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} placeholder="z.B. Geschäftsreisender" {...register("author_role_de")} disabled={isDeleted} aria-invalid={errors.author_role_de ? true : undefined} />
                <FieldErr msg={errors.author_role_de?.message} />
              </div>
            }
            en={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} placeholder="e.g. Business traveler" {...register("author_role_en")} disabled={isDeleted} aria-invalid={errors.author_role_en ? true : undefined} />
                <FieldErr msg={errors.author_role_en?.message} />
              </div>
            }
          />
          <AdminFormField
            label="Author photo"
            hint="Square crop works best. DSGVO: only with the person's written consent."
            error={errors.author_photo_url?.message}
          >
            <Controller
              name="author_photo_url"
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

      <AdminCard title="Quote">
        <BilingualField
          label="Quote"
          required
          hint="Minimum 5 characters. No quotation marks needed; the public site adds them."
          de={
            <div className="flex flex-col gap-1">
              <textarea rows={5} className={adminTextareaClass} {...register("quote_de")} disabled={isDeleted} aria-invalid={errors.quote_de ? true : undefined} />
              <FieldErr msg={errors.quote_de?.message} />
            </div>
          }
          en={
            <div className="flex flex-col gap-1">
              <textarea rows={5} className={adminTextareaClass} {...register("quote_en")} disabled={isDeleted} aria-invalid={errors.quote_en ? true : undefined} />
              <FieldErr msg={errors.quote_en?.message} />
            </div>
          }
        />
      </AdminCard>

      {/* Metadata: tight 4-up row stays — these are tiny fields and stacking wastes space */}
      <AdminCard title="Metadata">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <AdminFormField label="Rating" hint="1–5" error={errors.rating?.message}>
            <input type="number" min="1" max="5" placeholder="—" className={adminInputClass} {...register("rating")} disabled={isDeleted} />
          </AdminFormField>
          <AdminFormField label="Date given" hint="YYYY-MM-DD" error={errors.date_given?.message}>
            <input type="date" className={adminInputClass} {...register("date_given")} disabled={isDeleted} />
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
      </AdminCard>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this testimonial?"
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
          title={authorName || initial?.author_name}
          subtitle={previewUrl}
        />
      )}
    </form>
  );
}