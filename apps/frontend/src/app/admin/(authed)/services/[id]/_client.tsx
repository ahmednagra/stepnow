// apps/frontend/src/app/admin/(authed)/services/[id]/_client.tsx
// Client island: fetches the service via React Query (browser bearer auth) and renders the edit form.

"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader, PreviewButton } from "@/components/admin";
import { ServiceForm } from "./_form";
import { servicePreviewUrl } from "@/utils/preview-urls";
import { useService } from "@/hooks/queries";

export function ServiceEditClient({ id }: { id: string }) {
  const { data: s, isLoading, isError } = useService(id);
  if (isLoading) return <div className="p-6 text-[13px] text-slate-500">Loading…</div>;
  if (isError || !s) notFound();
  const previewUrl = servicePreviewUrl(s.slug_de, s.slug_en);
  return (
    <>
      <AdminPageHeader
        eyebrow={`Service · ${s.slug_de}`}
        title={s.title_de}
        description={s.title_en}
        actions={
          <>
            <Link
              href="/admin/services"
              className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              All services
            </Link>
            {!s.is_deleted && s.active && (
              <PreviewButton variant="header" url={previewUrl} title={s.title_de} subtitle={previewUrl} />
            )}
          </>
        }
      />
      <div className="p-6"><ServiceForm mode="edit" initial={s} /></div>
    </>
  );
}
