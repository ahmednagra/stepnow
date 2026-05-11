// src/app/admin/(authed)/legal-pages/[slug]/page.tsx
import { notFound } from "next/navigation";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { LegalPageAdmin, LegalPageVersionAdmin } from "@/types";
import { AdminPageHeader } from "@/components/admin";
import { LegalPageEditor } from "./_editor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

async function loadAll(slug: string): Promise<{
  page: LegalPageAdmin | null;
  versions: LegalPageVersionAdmin[];
}> {
  const token = await getAccessTokenFromCookies();
  if (!token) return { page: null, versions: [] };

  const [pageRes, versionsRes] = await Promise.all([
    serverApiClient.get<LegalPageAdmin>(ENDPOINTS.ADMIN.LEGAL_PAGE(slug), undefined, token),
    serverApiClient.get<{ items: LegalPageVersionAdmin[] }>(
      ENDPOINTS.ADMIN.LEGAL_PAGE_VERSIONS(slug),
      undefined,
      token,
    ),
  ]);

  return {
    page: pageRes.data ?? null,
    versions: versionsRes.data?.items ?? [],
  };
}

export default async function LegalPageEditPage({ params }: PageProps) {
  const { page, versions } = await loadAll(params.slug);
  if (!page) notFound();

  const title = page.published_version?.title_de ?? page.draft_version?.title_de ?? page.slug;

  return (
    <>
      <AdminPageHeader
        title={title}
        description={`Editing legal page · slug: ${page.slug}`}
      />
      <div className="p-6">
        <LegalPageEditor initial={page} versions={versions} />
      </div>
    </>
  );
}
