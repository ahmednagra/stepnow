// apps/frontend/src/app/admin/(authed)/testimonials/[id]/page.tsx
// Testimonial edit page with preview to public testimonials page.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { TestimonialAdmin } from "@/types";
import { AdminPageHeader, PreviewButton } from "@/components/admin";
import { TestimonialForm } from "./_form";
import { testimonialsPreviewUrl } from "@/utils/preview-urls";

export const dynamic = "force-dynamic";

async function loadTestimonial(id: string): Promise<TestimonialAdmin | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;
  const res = await serverApiClient.get<TestimonialAdmin>(ENDPOINTS.ADMIN.TESTIMONIAL_BY_ID(id), undefined, token);
  return res.data ?? null;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const t = await loadTestimonial(params.id);
  return { title: t ? `${t.author_name} · Testimonials · StepNow Admin` : "Testimonial · StepNow Admin" };
}

export default async function TestimonialEditPage({ params }: { params: { id: string } }) {
  const t = await loadTestimonial(params.id);
  if (!t) notFound();
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
