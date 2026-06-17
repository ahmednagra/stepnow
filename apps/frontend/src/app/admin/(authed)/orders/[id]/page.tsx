// apps/frontend/src/app/admin/(authed)/orders/[id]/page.tsx
// Server shell — metadata only. Data is fetched client-side via React Query (bearer auth).

import type { Metadata } from "next";
import { OrderDetailClient } from "./_client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Order · StepNow Admin" };

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return <OrderDetailClient id={params.id} />;
}
