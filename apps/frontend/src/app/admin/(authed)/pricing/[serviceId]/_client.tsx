// apps/frontend/src/app/admin/(authed)/pricing/[serviceId]/_client.tsx
// Client island: fetches the service + pricing categories via React Query (browser bearer auth).

"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader, PreviewButton } from "@/components/admin";
import { PricingEditor } from "./_editor";
import { servicePreviewUrl } from "@/utils/preview-urls";
import { useService, useServicePricingCategories } from "@/hooks/queries";

export function PricingEditorClient({ serviceId }: { serviceId: string }) {
  const { data: service, isLoading, isError } = useService(serviceId);
  const { data: categories } = useServicePricingCategories(serviceId);
  if (isLoading) return <div className="p-6 text-[13px] text-slate-500">Loading…</div>;
  if (isError || !service) notFound();
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
                title={`Pricing ${service.title_de}`}
                subtitle={`/dienstleistungen/${service.slug_de}`}
              />
            )}
          </>
        }
      />
      <div className="p-6"><PricingEditor service={service} initialCategories={categories ?? []} /></div>
    </>
  );
}
