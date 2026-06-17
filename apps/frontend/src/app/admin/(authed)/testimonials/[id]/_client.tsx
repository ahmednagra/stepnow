// apps/frontend/src/app/admin/(authed)/testimonials/[id]/_client.tsx
// Client island: fetches the testimonial via React Query (browser bearer auth) and renders the edit form.

"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader, PreviewButton } from "@/components/admin";
import { TestimonialForm } from "./_form";
import { testimonialsPreviewUrl } from "@/utils/preview-urls";
import { useTestimonial } from "@/hooks/queries";

export function TestimonialEditClient({ id }: { id: string }) {
  const { data: t, isLoading, isError } = useTestimonial(id);
  if (isLoading) return <div className="p-6 text-[13px] text-slate-500">Loading…</div>;
  if (isError || !t) notFound();
  return (
    <>
      <AdminPageHeader
        eyebrow={`Testimonial · ${t.source}`}
        title={t.author_name}
        description={t.author_role_de ?? ""}
        actions={
          <>
            <Link
              href="/admin/testimonials"
              className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              All testimonials
            </Link>
            {!t.is_deleted && t.active && (
              <PreviewButton variant="header" url={testimonialsPreviewUrl()} title={t.author_name} subtitle="/referenzen" />
            )}
          </>
        }
      />
      <div className="p-6"><TestimonialForm mode="edit" initial={t} /></div>
    </>
  );
}
