// apps/frontend/src/app/admin/(authed)/vehicles/[id]/page.tsx
// Server shell — metadata only. Data is fetched client-side via React Query (bearer auth).

import type { Metadata } from "next";
import { VehicleEditClient } from "./_client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vehicle · StepNow Admin" };

export default function VehicleEditPage({ params }: { params: { id: string } }) {
  return <VehicleEditClient id={params.id} />;
}
