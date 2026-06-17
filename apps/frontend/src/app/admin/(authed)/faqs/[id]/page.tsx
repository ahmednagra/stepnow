// apps/frontend/src/app/admin/(authed)/faqs/[id]/page.tsx
// Server shell — metadata only. Data is fetched client-side via React Query (bearer auth).

import type { Metadata } from "next";
import { FaqEditClient } from "./_client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "FAQ · StepNow Admin" };

export default function FaqEditPage({ params }: { params: { id: string } }) {
  return <FaqEditClient id={params.id} />;
}
