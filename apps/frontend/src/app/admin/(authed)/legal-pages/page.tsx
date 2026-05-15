// apps/frontend/src/app/admin/(authed)/legal-pages/page.tsx
// Legal pages list with preview-per-slug and published status badge.

import Link from "next/link";
import { Plus, FileText, ArrowRight } from "lucide-react";
import {
  AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty,
  PreviewButton,
} from "@/components/admin";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { LegalPageAdmin } from "@/types";
import { legalPreviewUrl } from "@/utils/preview-urls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Legal pages · StepNow Admin" };

async function loadPages(): Promise<LegalPageAdmin[]> {
  const token = await getAccessTokenFromCookies();
  if (!token) return [];
  const res = await serverApiClient.get<{ items: LegalPageAdmin[] }>(
    ENDPOINTS.ADMIN.LEGAL_PAGES,
    undefined,
    token,
  );
  return res.data?.items ?? [];
}

export default async function LegalPagesListPage() {
  const pages = await loadPages();
  return (
    <>
      <AdminPageHeader
        eyebrow="Content"
        title="Legal pages"
        description="Imprint, privacy, terms. Each page has versioned drafts you can publish or roll back."
        actions={
          <Link
            href="/admin/legal-pages/new"
            className="flex h-9 items-center gap-1.5 bg-slate-900 px-3.5 text-[12.5px] font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New legal page
          </Link>
        }
      />
      <div className="p-6">
        <AdminCard flush title={`${pages.length} ${pages.length === 1 ? "page" : "pages"}`}>
          <AdminTable columns={["Slug", "Status", "Last updated", ""]}>
            {pages.length === 0 ? (
              <AdminTableEmpty message="No legal pages yet." />
            ) : (
              pages.map((p) => (
                <AdminTableRow key={p.slug}>
                  <AdminTableCell>
                    <Link href={`/admin/legal-pages/${p.slug}`} className="flex items-center gap-2 font-medium text-slate-900 hover:underline">
                      <FileText className="h-3.5 w-3.5 text-[#A8865A]" strokeWidth={1.5} aria-hidden="true" />
                      <span className="font-mono">{p.slug}</span>
                    </Link>
                  </AdminTableCell>
                  <AdminTableCell>
                    {p.published_version ? (
                      <span className="inline-block bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700">Published</span>
                    ) : (
                      <span className="inline-block bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-700">Draft only</span>
                    )}
                  </AdminTableCell>
                  <AdminTableCell>
                    <time dateTime={p.updated_at} className="text-[11.5px] tabular-nums text-slate-500">
                      {new Date(p.updated_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </time>
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {p.published_version && (
                        <PreviewButton
                          variant="icon"
                          url={legalPreviewUrl(p.slug)}
                          title={p.slug}
                          subtitle={`/legal/${p.slug}`}
                        />
                      )}
                      <Link
                        href={`/admin/legal-pages/${p.slug}`}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-700 hover:text-slate-900"
                      >
                        Edit <ArrowRight className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
                      </Link>
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))
            )}
          </AdminTable>
        </AdminCard>
      </div>
    </>
  );
}
