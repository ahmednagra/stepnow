// apps/frontend/src/app/admin/(authed)/faqs/[id]/page.tsx
// FAQ edit page with preview action.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { FaqAdmin } from "@/types";
import { AdminPageHeader, PreviewButton } from "@/components/admin";
import { FaqForm } from "./_form";
import { faqsPreviewUrl } from "@/utils/preview-urls";

export const dynamic = "force-dynamic";

async function loadFaq(id: string): Promise<FaqAdmin | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;
  const res = await serverApiClient.get<FaqAdmin>(ENDPOINTS.ADMIN.FAQ_BY_ID(id), undefined, token);
  return res.data ?? null;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const f = await loadFaq(params.id);
  return { title: f ? `${f.question_de.slice(0, 60)} · FAQs · StepNow Admin` : "FAQ · StepNow Admin" };
}

export default async function FaqEditPage({ params }: { params: { id: string } }) {
  const f = await loadFaq(params.id);
  if (!f) notFound();
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
