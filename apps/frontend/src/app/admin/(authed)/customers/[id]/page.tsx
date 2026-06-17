// app/admin/(authed)/customers/[id]/page.tsx
// Server shell — metadata only. Data is fetched client-side via React Query (bearer auth).

import type { Metadata } from "next";
import { CustomerEditClient } from "./_client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customer · StepNow Admin" };

export default function CustomerEditPage({ params }: { params: { id: string } }) {
  return <CustomerEditClient id={params.id} />;
}
