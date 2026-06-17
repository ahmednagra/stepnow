// src/app/admin/(authed)/legal-pages/new/_form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import {
  adminLegalPageCreateSchema,
  type AdminLegalPageCreateInput,
} from "@/schemas/admin-legal-page.schema";
import { useCreateLegalPage } from "@/hooks/mutations/useLegalPageMutations";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import {
  AdminCard,
  AdminFormField,
  adminInputClass,
} from "@/components/admin";

export function NewLegalPageForm() {
  const router = useRouter();
  const pushToast = useAdminToast((s) => s.push);
  const createPage = useCreateLegalPage();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLegalPageCreateInput>({
    resolver: zodResolver(adminLegalPageCreateSchema),
    defaultValues: { slug: "" },
  });

  async function onSubmit(values: AdminLegalPageCreateInput) {
    setServerError(null);
    try {
      const created = await createPage.mutateAsync({ slug: values.slug });
      pushToast("success", "Legal page created", `slug: ${created.slug}`);
      router.push(`/admin/legal-pages/${created.slug}`);
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Network error";
      setServerError(msg);
      pushToast("error", "Create failed", msg);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-4">
      {serverError && (
        <div role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {serverError}
        </div>
      )}

      <AdminCard title="Slug">
        <AdminFormField
          label="Slug"
          required
          error={errors.slug?.message}
          hint="Lowercase letters, digits and hyphens. Will be visible in the URL, e.g. /legal/impressum"
        >
          <input
            placeholder="impressum"
            className={`${adminInputClass} font-mono`}
            autoFocus
            {...register("slug")}
          />
        </AdminFormField>
      </AdminCard>

      <div className="flex items-center justify-end gap-2">
        <Link
          href="/admin/legal-pages"
          className="flex h-9 items-center border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-700 transition-colors hover:bg-slate-100"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-9 items-center gap-2 bg-slate-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Create page
        </button>
      </div>
    </form>
  );
}
