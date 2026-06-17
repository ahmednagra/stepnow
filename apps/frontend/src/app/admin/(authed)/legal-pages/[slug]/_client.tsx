// apps/frontend/src/app/admin/(authed)/legal-pages/[slug]/_client.tsx
// Client island: fetches the legal page + version history via React Query (browser bearer auth).

"use client";

import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin";
import { LegalPageEditor } from "./_editor";
import { useLegalPage, useLegalPageVersions } from "@/hooks/queries";

export function LegalPageEditClient({ slug }: { slug: string }) {
  const { data: page, isLoading, isError } = useLegalPage(slug);
  const { data: versions } = useLegalPageVersions(slug);
  if (isLoading) return <div className="p-6 text-[13px] text-slate-500">Loading…</div>;
  if (isError || !page) notFound();
  const title = page.published_version?.title_de ?? page.draft_version?.title_de ?? page.slug;
  return (
    <>
      <AdminPageHeader title={title} description={`Editing legal page · slug: ${page.slug}`} />
      <div className="p-6">
        <LegalPageEditor initial={page} versions={versions?.items ?? []} />
      </div>
    </>
  );
}
