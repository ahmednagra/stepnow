// src/app/admin/(authed)/vehicles/[id]/page.tsx
import { notFound } from "next/navigation";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { VehicleAdmin } from "@/types";
import { AdminPageHeader } from "@/components/admin";
import { VehicleForm } from "./_form";

export const dynamic = "force-dynamic";

async function loadVehicle(id: string): Promise<VehicleAdmin | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;
  const res = await serverApiClient.get<VehicleAdmin>(
    ENDPOINTS.ADMIN.VEHICLE_BY_ID(id),
    undefined,
    token,
  );
  return res.data ?? null;
}

export default async function VehicleEditPage({ params }: { params: { id: string } }) {
  const v = await loadVehicle(params.id);
  if (!v) notFound();
  return (
    <>
      <AdminPageHeader title={v.name_de} description={`Editing vehicle · ${v.category}`} />
      <div className="p-6">
        <VehicleForm mode="edit" initial={v} />
      </div>
    </>
  );
}
