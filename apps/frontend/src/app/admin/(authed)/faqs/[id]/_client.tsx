// apps/frontend/src/app/admin/(authed)/faqs/[id]/_client.tsx
// Client island: fetches the FAQ via React Query (browser bearer auth) and renders the edit form.

"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader, PreviewButton } from "@/components/admin";
import { FaqForm } from "./_form";
import { faqsPreviewUrl } from "@/utils/preview-urls";
import { useFaq } from "@/hooks/queries";

export function FaqEditClient({ id }: { id: string }) {
  const { data: f, isLoading, isError } = useFaq(id);
  if (isLoading) return <div className="p-6 text-[13px] text-slate-500">Loading…</div>;
  if (isError || !f) notFound();
  return (
    <>
      <AdminPageHeader
        eyebrow={`FAQ · ${f.category ?? "general"}`}
        title={f.question_de}
        description={f.question_en}
        actions={
          <>
            <Link
              href="/admin/faqs"
              className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              All FAQs
            </Link>
            {!f.is_deleted && f.active && (
              <PreviewButton variant="header" url={faqsPreviewUrl()} title={f.question_de} subtitle="/faq" />
            )}
          </>
        }
      />
      <div className="p-6"><FaqForm mode="edit" initial={f} /></div>
    </>
  );
}
