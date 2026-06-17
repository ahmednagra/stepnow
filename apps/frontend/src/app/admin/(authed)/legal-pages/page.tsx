// apps/frontend/src/app/admin/(authed)/legal-pages/page.tsx
// Server shell — metadata only. Data is fetched client-side via React Query (bearer auth).

import type { Metadata } from "next";
import { LegalPagesListClient } from "./_client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Legal pages · StepNow Admin" };

export default function LegalPagesListPage() {
  return <LegalPagesListClient />;
}
