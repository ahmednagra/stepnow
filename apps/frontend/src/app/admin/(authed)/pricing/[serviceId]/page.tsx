// apps/frontend/src/app/admin/(authed)/pricing/[serviceId]/page.tsx
// Server shell — metadata only. Data is fetched client-side via React Query (bearer auth).

import type { Metadata } from "next";
import { PricingEditorClient } from "./_client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pricing · StepNow Admin" };

export default function PricingEditorPage({ params }: { params: { serviceId: string } }) {
  return <PricingEditorClient serviceId={params.serviceId} />;
}
