// apps/frontend/src/app/admin/(authed)/pricing/page.tsx
// Pricing index — pick a service to open its pricing editor. Includes preview links.

import Link from "next/link";
import { ArrowRight, Tags } from "lucide-react";
import {
  AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty,
  PreviewButton,
} from "@/components/admin";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, ServiceAdmin } from "@/types";
import { pricingPreviewUrl, servicePreviewUrl } from "@/utils/preview-urls";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pricing · StepNow Admin" };

async function loadServices(): Promise<ServiceAdmin[]> {
  const token = await getAccessTokenFromCookies();
  if (!token) return [];
  const res = await serverApiClient.get<Paginated<ServiceAdmin>>(
    ENDPOINTS.ADMIN.SERVICES,
    { params: { size: 100, include_inactive: true } },
    token,
  );
  return res.data?.items ?? [];
}

export default async function PricingIndexPage() {
  const services = await loadServices();
  const active = services.filter((s) => !s.is_deleted);
  return (
    <>
      <AdminPageHeader
        eyebrow="Content"
        title="Pricing"
        description="Choose a service to edit its pricing categories and routes."
        actions={
          <PreviewButton variant="header" url={pricingPreviewUrl()} title="Pricing page" subtitle="/preise" />
        }
      />
      <div className="p-6">
        <AdminCard flush title={`${active.length} ${active.length === 1 ? "service" : "services"}`}>
          <AdminTable columns={["Service", "Slug", "Status", ""]}>
            {active.length === 0 ? (
              <AdminTableEmpty message="No services yet — add a service first." />
            ) : (
              active.map((s) => (
                <AdminTableRow key={s.id}>
                  <AdminTableCell>
                    <Link href={`/admin/pricing/${s.id}`} className="flex items-center gap-2 font-medium text-slate-900 hover:underline">
                      <Tags className="h-3.5 w-3.5 text-[#A8865A]" strokeWidth={1.5} aria-hidden="true" />
                      {s.title_de}
                    </Link>
                    <p className="text-[11px] text-slate-500 ml-5">{s.title_en}</p>
                  </AdminTableCell>
                  <AdminTableCell>
                    <p className="font-mono text-[11px] text-slate-600">{s.slug_de}</p>
                    <p className="font-mono text-[11px] text-slate-400">{s.slug_en}</p>
                  </AdminTableCell>
                  <AdminTableCell>
                    {s.active ? (
                      <span className="inline-block bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-700">Active</span>
                    ) : (
                      <span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">Inactive</span>
                    )}
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {s.active && (
                        <PreviewButton
                          variant="icon"
                          url={servicePreviewUrl(s.slug_de, s.slug_en)}
                          title={`Pricing — ${s.title_de}`}
                          subtitle={`/dienstleistungen/${s.slug_de}`}
                        />
                      )}
                      <Link
                        href={`/admin/pricing/${s.id}`}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-slate-700 hover:text-slate-900"
                      >
                        Edit pricing <ArrowRight className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
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
