// apps/frontend/src/app/admin/(authed)/contact-messages/[id]/page.tsx
// Server shell — metadata only. Data is fetched client-side via React Query (bearer auth).

import type { Metadata } from "next";
import { ContactMessageDetailClient } from "./_client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Message · StepNow Admin" };

export default function ContactMessageDetailPage({ params }: { params: { id: string } }) {
  return <ContactMessageDetailClient id={params.id} />;
}
