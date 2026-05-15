// apps/frontend/src/app/admin/(authed)/vehicles/[id]/page.tsx
// Server component, drops VehicleForm with preview action in header.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { VehicleAdmin } from "@/types";
import { AdminPageHeader, PreviewButton } from "@/components/admin";
import { VehicleForm } from "./_form";
import { vehiclesPreviewUrl } from "@/utils/preview-urls";

export const dynamic = "force-dynamic";

async function loadVehicle(id: string): Promise<VehicleAdmin | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;
  const res = await serverApiClient.get<VehicleAdmin>(ENDPOINTS.ADMIN.VEHICLE_BY_ID(id), undefined, token);
  return res.data ?? null;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const v = await loadVehicle(params.id);
  return { title: v ? `${v.name_de} · Vehicles · StepNow Admin` : "Vehicle · StepNow Admin" };
}

export default async function VehicleEditPage({ params }: { params: { id: string } }) {
  const v = await loadVehicle(params.id);
  if (!v) notFound();
  return (
    <>
      <AdminPageHeader
        eyebrow={`Vehicle · ${v.category}`}
        title={v.name_de}
        description={v.name_en}
        actions={
          <>
            <Link
              href="/admin/vehicles"
              className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
              All vehicles
            </Link>
            {!v.is_deleted && v.active && (
              <PreviewButton variant="header" url={vehiclesPreviewUrl()} title={v.name_de} subtitle="/fahrzeuge" />
            )}
          </>
        }
      />
      <div className="p-6"><VehicleForm mode="edit" initial={v} /></div>
    </>
  );
}
