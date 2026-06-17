// apps/frontend/src/app/admin/(authed)/vehicles/[id]/_client.tsx
// Client island: fetches the vehicle via React Query (browser bearer auth) and renders the edit form.

"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader, PreviewButton } from "@/components/admin";
import { VehicleForm } from "./_form";
import { vehiclesPreviewUrl } from "@/utils/preview-urls";
import { useVehicle } from "@/hooks/queries";

export function VehicleEditClient({ id }: { id: string }) {
  const { data: v, isLoading, isError } = useVehicle(id);
  if (isLoading) return <div className="p-6 text-[13px] text-slate-500">Loading…</div>;
  if (isError || !v) notFound();
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
