// src/app/admin/(authed)/pricing/[serviceId]/page.tsx
import { notFound } from "next/navigation";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { ServiceAdmin, PricingCategoryAdmin } from "@/types";
import { AdminPageHeader } from "@/components/admin";
import { PricingEditor } from "./_editor";

export const dynamic = "force-dynamic";

async function loadAll(serviceId: string): Promise<{
  service: ServiceAdmin | null;
  categories: PricingCategoryAdmin[];
}> {
  const token = await getAccessTokenFromCookies();
  if (!token) return { service: null, categories: [] };
  const [svcRes, catsRes] = await Promise.all([
    serverApiClient.get<ServiceAdmin>(
      ENDPOINTS.ADMIN.SERVICE_BY_ID(serviceId),
      undefined,
      token,
    ),
    serverApiClient.get<PricingCategoryAdmin[]>(
      ENDPOINTS.ADMIN.SERVICE_PRICING_CATEGORIES(serviceId),
      undefined,
      token,
    ),
  ]);
  return {
    service: svcRes.data ?? null,
    categories: catsRes.data ?? [],
  };
}

export default async function PricingEditorPage({
  params,
}: {
  params: { serviceId: string };
}) {
  const { service, categories } = await loadAll(params.serviceId);
  if (!service) notFound();
  return (
    <>
      <AdminPageHeader
        title={`Pricing · ${service.title_de}`}
        description={`Edit categories and items for ${service.slug_de} / ${service.slug_en}`}
      />
      <div className="p-6">
        <PricingEditor service={service} initialCategories={categories} />
      </div>
    </>
  );
}
