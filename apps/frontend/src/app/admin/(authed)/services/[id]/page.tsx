// apps/frontend/src/app/admin/(authed)/services/[id]/page.tsx
// Server component. Loads service + drops form with header that includes a Preview button.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { ServiceAdmin } from "@/types";
import { AdminPageHeader, PreviewButton } from "@/components/admin";
import { ServiceForm } from "./_form";
import { servicePreviewUrl } from "@/utils/preview-urls";

export const dynamic = "force-dynamic";

async function loadService(id: string): Promise<ServiceAdmin | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;
  const res = await serverApiClient.get<ServiceAdmin>(ENDPOINTS.ADMIN.SERVICE_BY_ID(id), undefined, token);
  return res.data ?? null;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const s = await loadService(params.id);
  return { title: s ? `${s.title_de} · Services · StepNow Admin` : "Service · StepNow Admin" };
}

export default async function ServiceEditPage({ params }: { params: { id: string } }) {
  const s = await loadService(params.id);
  if (!s) notFound();
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
              <PreviewButton
                variant="header"
                url={previewUrl}
                title={s.title_de}
                subtitle={previewUrl}
              />
            )}
          </>
        }
      />
      <div className="p-6"><ServiceForm mode="edit" initial={s} /></div>
    </>
  );
}
