// apps/frontend/src/app/admin/(authed)/pricing/[serviceId]/page.tsx
// Pricing editor wrapper with preview action.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { ServiceAdmin, PricingCategoryAdmin } from "@/types";
import { AdminPageHeader, PreviewButton } from "@/components/admin";
import { PricingEditor } from "./_editor";
import { servicePreviewUrl } from "@/utils/preview-urls";

export const dynamic = "force-dynamic";

async function loadAll(serviceId: string): Promise<{ service: ServiceAdmin | null; categories: PricingCategoryAdmin[] }> {
  const token = await getAccessTokenFromCookies();
  if (!token) return { service: null, categories: [] };
  const [svcRes, catsRes] = await Promise.all([
    serverApiClient.get<ServiceAdmin>(ENDPOINTS.ADMIN.SERVICE_BY_ID(serviceId), undefined, token),
    serverApiClient.get<PricingCategoryAdmin[]>(ENDPOINTS.ADMIN.SERVICE_PRICING_CATEGORIES(serviceId), undefined, token),
  ]);
  return { service: svcRes.data ?? null, categories: catsRes.data ?? [] };
}

export async function generateMetadata({ params }: { params: { serviceId: string } }) {
  const { service } = await loadAll(params.serviceId);
  return { title: service ? `Pricing — ${service.title_de} · StepNow Admin` : "Pricing · StepNow Admin" };
}

export default async function PricingEditorPage({ params }: { params: { serviceId: string } }) {
  const { service, categories } = await loadAll(params.serviceId);
  if (!service) notFound();
  return (
    <>
      <AdminPageHeader
        eyebrow={`Pricing · ${service.slug_de}`}
        title={service.title_de}
        description={`Categories and items for ${service.slug_de} / ${service.slug_en}`}
        actions={
          <>
            <Link
              href="/admin/pricing"
              className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              All pricing
            </Link>
            {service.active && (
              <PreviewButton
                variant="header"
                url={servicePreviewUrl(service.slug_de, service.slug_en)}
                title={`Pricing — ${service.title_de}`}
                subtitle={`/dienstleistungen/${service.slug_de}`}
              />
            )}
          </>
        }
      />
      <div className="p-6"><PricingEditor service={service} initialCategories={categories} /></div>
    </>
  );
}
