// src/app/admin/(authed)/legal-pages/[slug]/page.tsx
// Server shell — metadata only. Data is fetched client-side via React Query (bearer auth).

import type { Metadata } from "next";
import { LegalPageEditClient } from "./_client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Legal page · StepNow Admin" };

export default function LegalPageEditPage({ params }: { params: { slug: string } }) {
  return <LegalPageEditClient slug={params.slug} />;
}
