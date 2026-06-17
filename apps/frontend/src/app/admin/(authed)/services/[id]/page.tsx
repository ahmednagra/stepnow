// apps/frontend/src/app/admin/(authed)/services/[id]/page.tsx
// Server shell — metadata only. Data is fetched client-side via React Query (bearer auth).

import type { Metadata } from "next";
import { ServiceEditClient } from "./_client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Service · StepNow Admin" };

export default function ServiceEditPage({ params }: { params: { id: string } }) {
  return <ServiceEditClient id={params.id} />;
}
