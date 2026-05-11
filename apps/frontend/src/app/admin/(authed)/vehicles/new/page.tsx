// src/app/admin/(authed)/vehicles/new/page.tsx
import { AdminPageHeader } from "@/components/admin";
import { VehicleForm } from "../[id]/_form";

export default function NewVehiclePage() {
  return (
    <>
      <AdminPageHeader title="New vehicle" description="Add a vehicle to the fleet." />
      <div className="p-6">
        <VehicleForm mode="create" />
      </div>
    </>
  );
}
