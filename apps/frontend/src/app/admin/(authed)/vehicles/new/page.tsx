// apps/frontend/src/app/admin/(authed)/vehicles/new/page.tsx
// New vehicle create page.

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { VehicleForm } from "../[id]/_form";

export const metadata = { title: "New vehicle · StepNow Admin" };

export default function NewVehiclePage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Vehicles"
        title="New vehicle"
        description="Add a vehicle to the public fleet."
        actions={
          <Link
            href="/admin/vehicles"
            className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            All vehicles
          </Link>
        }
      />
      <div className="p-6"><VehicleForm mode="create" /></div>
    </>
  );
}
