// apps/frontend/src/app/admin/(authed)/pricing/page.tsx
// Server shell — metadata only. Data is fetched client-side via React Query (bearer auth).

import type { Metadata } from "next";
import { PricingIndexClient } from "./_client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pricing · StepNow Admin" };

export default function PricingIndexPage() {
  return <PricingIndexClient />;
}
