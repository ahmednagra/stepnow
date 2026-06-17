// apps/frontend/src/app/admin/(authed)/faqs/[id]/_form.tsx
// FAQ create/edit form with Preview button beside Cancel.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Trash2, RotateCcw, Eye } from "lucide-react";
import { adminFaqSchema, type AdminFaqInput } from "@/schemas/admin-faq.schema";
import { type FaqCreateInput } from "@/services/faqs";
import {
  useCreateFaq, useUpdateFaq, useDeleteFaq, useRestoreFaq,
} from "@/hooks/mutations/useFaqMutations";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import {
  AdminCard, AdminFormField, BilingualField, ConfirmDialog, PreviewModal,
  adminInputClass, adminTextareaClass,
} from "@/components/admin";
import type { FaqAdmin } from "@/types";
import { faqsPreviewUrl } from "@/utils/preview-urls";

type Mode = "create" | "edit";
interface FaqFormProps { mode: Mode; initial?: FaqAdmin; }

function emptyDefaults(): AdminFaqInput {
  return {
    sort_order: 0, active: true, category: "general",
    question_de: "", question_en: "", answer_de: "", answer_en: "",
  };
}

function fromFaq(q: FaqAdmin): AdminFaqInput {
  return {
    sort_order: q.sort_order ?? 0, active: q.active ?? true, category: q.category,
    question_de: q.question_de, question_en: q.question_en,
    answer_de: q.answer_de, answer_en: q.answer_en,
  };
}

function toPayload(values: AdminFaqInput): FaqCreateInput {
  return {
    sort_order: values.sort_order, active: values.active, category: values.category,
    question_de: values.question_de, question_en: values.question_en,
    answer_de: values.answer_de, answer_en: values.answer_en,
  };
}

// Inline error helper for BilingualField sides (which don't accept error props).
function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p role="alert" className="text-[11px] font-medium text-rose-700">{msg}</p>;
}

export function FaqForm({ mode, initial }: FaqFormProps) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq(initial?.id ?? "");
  const deleteFaq = useDeleteFaq();
  const restoreFaq = useRestoreFaq();

  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminFaqInput>({
    resolver: zodResolver(adminFaqSchema),
    defaultValues: initial ? fromFaq(initial) : emptyDefaults(),
  });

  const questionDe = watch("question_de");

  async function onSubmit(values: AdminFaqInput) {
    setServerError(null);
    try {
      if (mode === "create") {
        const created = await createFaq.mutateAsync(toPayload(values));
        pushToast("success", "FAQ created");
        router.push(`/admin/faqs/${created.id}`);
        router.refresh();
      } else if (initial) {
        const updated = await updateFaq.mutateAsync(toPayload(values));
        reset(fromFaq(updated));
        pushToast("success", "FAQ saved");
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
      await deleteFaq.mutateAsync(initial.id);
      pushToast("success", "FAQ deleted");
      router.push("/admin/faqs");
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
      const restored = await restoreFaq.mutateAsync(initial.id);
      reset(fromFaq(restored));
      pushToast("success", "FAQ restored");
      router.refresh();
    } catch (err) {
      pushToast("error", "Restore failed", err instanceof ApiError ? err.message : "Network error");
    } finally { setBusy(false); }
  }

  const isDeleted = initial?.is_deleted ?? false;
  const canPreview = mode === "edit" && initial && !isDeleted && initial.active;
  const previewUrl = canPreview ? faqsPreviewUrl() : "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
        <p className="text-[12px] text-slate-500">
          {isDeleted
            ? "This FAQ is deleted. Restore it to make it editable."
            : isDirty
              ? "You have unsaved changes."
              : mode === "create"
                ? "Fill in the form to create a new FAQ."
                : "All changes saved."}
        </p>
        <div className="flex items-center gap-2">
          <Link href="/admin/faqs" className="flex h-9 items-center border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-100">
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

      <AdminCard title="Question">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <AdminFormField label="Category" required error={errors.category?.message} hint="e.g. general, payment, booking">
              <input className={adminInputClass} {...register("category")} disabled={isDeleted} />
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
          <BilingualField
            label="Question"
            required
            de={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} {...register("question_de")} disabled={isDeleted} aria-invalid={errors.question_de ? true : undefined} />
                <FieldErr msg={errors.question_de?.message} />
              </div>
            }
            en={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} {...register("question_en")} disabled={isDeleted} aria-invalid={errors.question_en ? true : undefined} />
                <FieldErr msg={errors.question_en?.message} />
              </div>
            }
          />
        </div>
      </AdminCard>

      <AdminCard title="Answer" description="Markdown supported.">
        <BilingualField
          label="Answer"
          required
          de={
            <div className="flex flex-col gap-1">
              <textarea rows={6} className={`${adminTextareaClass} font-mono text-[12px]`} {...register("answer_de")} disabled={isDeleted} aria-invalid={errors.answer_de ? true : undefined} />
              <FieldErr msg={errors.answer_de?.message} />
            </div>
          }
          en={
            <div className="flex flex-col gap-1">
              <textarea rows={6} className={`${adminTextareaClass} font-mono text-[12px]`} {...register("answer_en")} disabled={isDeleted} aria-invalid={errors.answer_en ? true : undefined} />
              <FieldErr msg={errors.answer_en?.message} />
            </div>
          }
        />
      </AdminCard>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this FAQ?"
        description="It will be soft-deleted and hidden from the public site."
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
          title={questionDe || initial?.question_de}
          subtitle={previewUrl}
        />
      )}
    </form>
  );
}
