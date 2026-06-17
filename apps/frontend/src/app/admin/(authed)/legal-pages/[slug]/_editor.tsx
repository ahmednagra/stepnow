// apps/frontend/src/app/admin/(authed)/legal-pages/[slug]/_editor.tsx
// Legal page draft + publish + version history editor.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Send, History, Eye, EyeOff, RotateCcw } from "lucide-react";
import {
  adminLegalPageDraftSchema,
  type AdminLegalPageDraftInput,
} from "@/schemas/admin-legal-page.schema";
import { listAdminLegalPageVersions } from "@/services/legalPages";
import {
  useSaveLegalPageDraft,
  usePublishLegalPage,
  useRollbackLegalPage,
} from "@/hooks/mutations/useLegalPageMutations";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import {
  AdminCard,
  AdminFormField,
  BilingualField,
  AdminMarkdownPreview,
  ConfirmDialog,
  adminInputClass,
  adminTextareaClass,
} from "@/components/admin";
import type { LegalPageAdmin, LegalPageVersionAdmin } from "@/types";

interface LegalPageEditorProps {
  initial: LegalPageAdmin;
  versions: LegalPageVersionAdmin[];
}

type PreviewLocale = "de" | "en";

function pickDraftDefaults(p: LegalPageAdmin): AdminLegalPageDraftInput {
  const src = p.draft_version ?? p.published_version;
  return {
    title_de: src?.title_de ?? "",
    title_en: src?.title_en ?? "",
    body_de: src?.body_de ?? "",
    body_en: src?.body_en ?? "",
    changes_summary: "",
  };
}

// Inline error for slots inside BilingualField (which doesn't accept error props).
function FieldErr({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p role="alert" className="text-[11px] font-medium text-rose-700">{msg}</p>;
}

export function LegalPageEditor({ initial, versions: initialVersions }: LegalPageEditorProps) {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const saveDraft = useSaveLegalPageDraft(initial.slug);
  const publishPage = usePublishLegalPage(initial.slug);
  const rollbackPage = useRollbackLegalPage(initial.slug);
  const [serverError, setServerError] = useState<string | null>(null);
  const [versions, setVersions] = useState<LegalPageVersionAdmin[]>(initialVersions);
  const [previewLocale, setPreviewLocale] = useState<PreviewLocale>("de");
  const [showPreview, setShowPreview] = useState(true);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmRollback, setConfirmRollback] = useState<LegalPageVersionAdmin | null>(null);
  const [busy, setBusy] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AdminLegalPageDraftInput>({
    resolver: zodResolver(adminLegalPageDraftSchema),
    defaultValues: pickDraftDefaults(initial),
  });

  const bodyDe = watch("body_de");
  const bodyEn = watch("body_en");
  const liveBody = previewLocale === "de" ? bodyDe : bodyEn;

  async function refreshVersions() {
    try {
      const res = await listAdminLegalPageVersions(initial.slug);
      setVersions(res.items);
    } catch {
      /* non-fatal */
    }
  }

  async function onSaveDraft(values: AdminLegalPageDraftInput) {
    setServerError(null);
    try {
      const updated = await saveDraft.mutateAsync({
        title_de: values.title_de,
        title_en: values.title_en,
        body_de: values.body_de,
        body_en: values.body_en,
        changes_summary: values.changes_summary?.trim() || null,
      });
      reset(pickDraftDefaults(updated));
      pushToast("success", "Draft saved", "Your changes are not yet published.");
      void refreshVersions();
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Network error";
      setServerError(msg);
      pushToast("error", "Save failed", msg);
    }
  }

  async function onPublish() {
    setBusy(true);
    setServerError(null);
    try {
      const values = watch();
      if (isDirty) {
        await saveDraft.mutateAsync({
          title_de: values.title_de,
          title_en: values.title_en,
          body_de: values.body_de,
          body_en: values.body_en,
          changes_summary: values.changes_summary?.trim() || null,
        });
      }
      const published = await publishPage.mutateAsync({
        changes_summary: values.changes_summary?.trim() || null,
      });
      reset(pickDraftDefaults(published));
      pushToast("success", "Published", "Now live on the public site.");
      void refreshVersions();
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Network error";
      setServerError(msg);
      pushToast("error", "Publish failed", msg);
    } finally {
      setBusy(false);
    }
  }

  async function onRollback(target: LegalPageVersionAdmin) {
    setBusy(true);
    setServerError(null);
    try {
      const result = await rollbackPage.mutateAsync({
        target_version_id: target.id,
        changes_summary: `Rolled back to v${target.version_number}`,
      });
      reset(pickDraftDefaults(result));
      pushToast("success", "Rolled back", `Now showing v${target.version_number}.`);
      void refreshVersions();
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Network error";
      setServerError(msg);
      pushToast("error", "Rollback failed", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSaveDraft)} className="flex flex-col gap-6">
        {/* Sticky action bar */}
        <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-2 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-6 py-3">
          <p className="text-[12px] text-slate-500">
            {isDirty
              ? "You have unsaved draft changes."
              : initial.draft_version
                ? "Draft saved, not yet published."
                : initial.published_version
                  ? `Published v${initial.published_version.version_number}`
                  : "Not yet published."}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/legal-pages"
              className="flex h-9 items-center border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
            >
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {showPreview ? "Hide preview" : "Show preview"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || busy || !isDirty}
              className="flex h-9 items-center gap-2 border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save draft
            </button>
            <button
              type="button"
              onClick={() => setConfirmPublish(true)}
              disabled={busy || isSubmitting}
              className="flex h-9 items-center gap-2 bg-slate-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Publish
            </button>
          </div>
        </div>

        {serverError && (
          <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
            {serverError}
          </div>
        )}

        <AdminCard title="Title">
          <BilingualField
            label="Title"
            required
            de={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} {...register("title_de")} aria-invalid={errors.title_de ? true : undefined} />
                <FieldErr msg={errors.title_de?.message} />
              </div>
            }
            en={
              <div className="flex flex-col gap-1">
                <input className={adminInputClass} {...register("title_en")} aria-invalid={errors.title_en ? true : undefined} />
                <FieldErr msg={errors.title_en?.message} />
              </div>
            }
          />
        </AdminCard>

        <AdminCard
          title="Body"
          description="Markdown supported. Placeholders like {business_name} resolve from business settings."
          headerActions={
            showPreview && (
              <div className="flex items-center gap-1 border border-slate-200 bg-slate-50 p-0.5">
                <button
                  type="button"
                  onClick={() => setPreviewLocale("de")}
                  className={
                    previewLocale === "de"
                      ? "h-6 bg-white px-2 text-[11px] font-medium text-slate-900 shadow-sm"
                      : "h-6 px-2 text-[11px] text-slate-500 hover:text-slate-900"
                  }
                >
                  Preview DE
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLocale("en")}
                  className={
                    previewLocale === "en"
                      ? "h-6 bg-white px-2 text-[11px] font-medium text-slate-900 shadow-sm"
                      : "h-6 px-2 text-[11px] text-slate-500 hover:text-slate-900"
                  }
                >
                  Preview EN
                </button>
              </div>
            )
          }
        >
          {showPreview ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  Editor · {previewLocale.toUpperCase()}
                </span>
                <textarea
                  rows={24}
                  className={`${adminTextareaClass} font-mono text-[12px]`}
                  {...register(previewLocale === "de" ? "body_de" : "body_en")}
                />
                {(previewLocale === "de" ? errors.body_de : errors.body_en) && (
                  <p role="alert" className="text-[11px] text-red-600">
                    {(previewLocale === "de" ? errors.body_de : errors.body_en)?.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Preview</span>
                <div className="min-h-[24rem] overflow-y-auto border border-slate-200 bg-white p-4">
                  <AdminMarkdownPreview source={liveBody ?? ""} />
                </div>
              </div>
            </div>
          ) : (
            <BilingualField
              label="Body"
              required
              de={
                <div className="flex flex-col gap-1">
                  <textarea
                    rows={20}
                    className={`${adminTextareaClass} font-mono text-[12px]`}
                    {...register("body_de")}
                    aria-invalid={errors.body_de ? true : undefined}
                  />
                  <FieldErr msg={errors.body_de?.message} />
                </div>
              }
              en={
                <div className="flex flex-col gap-1">
                  <textarea
                    rows={20}
                    className={`${adminTextareaClass} font-mono text-[12px]`}
                    {...register("body_en")}
                    aria-invalid={errors.body_en ? true : undefined}
                  />
                  <FieldErr msg={errors.body_en?.message} />
                </div>
              }
            />
          )}
        </AdminCard>

        <AdminCard
          title="Changes summary"
          description="Short note describing this revision. Stored with the version history."
        >
          <AdminFormField label="Changes summary" hint="optional" error={errors.changes_summary?.message}>
            <textarea
              rows={2}
              placeholder="e.g. Updated contact email; fixed paragraph 3 typo"
              className={adminTextareaClass}
              {...register("changes_summary")}
            />
          </AdminFormField>
        </AdminCard>

        <AdminCard
          title="Version history"
          description={`${versions.length} version${versions.length === 1 ? "" : "s"} on record.`}
          headerActions={<History className="h-3 w-3 text-slate-400" aria-hidden="true" />}
        >
          {versions.length === 0 ? (
            <p className="text-[12px] italic text-slate-500">
              No versions yet. Save the first draft above to create one.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100">
              {versions.map((v) => (
                <li key={v.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] font-medium text-slate-900">v{v.version_number}</span>
                      {v.is_published ? (
                        <span className="inline-flex items-center bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700">
                          Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700">
                          Draft
                        </span>
                      )}
                      <time
                        dateTime={v.created_at}
                        className="text-[11px] text-slate-500"
                        title={v.created_at}
                      >
                        {new Date(v.created_at).toLocaleString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </time>
                    </div>
                    {v.changes_summary && (
                      <p className="mt-0.5 text-[11px] text-slate-500">{v.changes_summary}</p>
                    )}
                  </div>
                  {!v.is_published && (
                    <button
                      type="button"
                      onClick={() => setConfirmRollback(v)}
                      disabled={busy}
                      className="flex h-7 shrink-0 items-center gap-1 border border-slate-300 bg-white px-2 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Rollback to this
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      </form>

      <ConfirmDialog
        open={confirmPublish}
        title="Publish this draft?"
        description={
          isDirty
            ? "Your unsaved changes will be saved as a draft and then published. This makes them live on the public site."
            : "This will publish the current draft, making it live on the public site."
        }
        confirmLabel="Publish"
        tone="primary"
        onConfirm={() => {
          setConfirmPublish(false);
          void onPublish();
        }}
        onCancel={() => setConfirmPublish(false)}
      />

      <ConfirmDialog
        open={confirmRollback !== null}
        title={`Rollback to v${confirmRollback?.version_number ?? "?"}?`}
        description="This will replace the current draft with the content from this version. You'll need to publish afterwards to make it live."
        confirmLabel="Rollback"
        tone="danger"
        onConfirm={() => {
          if (confirmRollback) {
            const target = confirmRollback;
            setConfirmRollback(null);
            void onRollback(target);
          }
        }}
        onCancel={() => setConfirmRollback(null)}
      />
    </>
  );
}
