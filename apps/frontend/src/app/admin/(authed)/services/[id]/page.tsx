// src/app/admin/(authed)/services/[id]/page.tsx
import { notFound } from "next/navigation";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { ServiceAdmin } from "@/types";
import { AdminPageHeader } from "@/components/admin";
import { ServiceForm } from "./_form";

export const dynamic = "force-dynamic";

async function loadService(id: string): Promise<ServiceAdmin | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;
  const res = await serverApiClient.get<ServiceAdmin>(
    ENDPOINTS.ADMIN.SERVICE_BY_ID(id),
    undefined,
    token,
  );
  return res.data ?? null;
}

interface PageProps {
  params: { id: string };
}

export default async function ServiceEditPage({ params }: PageProps) {
  const service = await loadService(params.id);
  if (!service) notFound();
  return (
    <>
      <AdminPageHeader
        title={service.title_de}
        description={`Editing service · ${service.slug_de} / ${service.slug_en}`}
      />
      <div className="p-6">
        <ServiceForm mode="edit" initial={service} />
      </div>
    </>
  );
}
