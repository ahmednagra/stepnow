// apps/frontend/src/app/admin/(authed)/bookings/[id]/page.tsx
// Server shell — metadata only. Data is fetched client-side via React Query (bearer auth).

import type { Metadata } from "next";
import { BookingDetailClient } from "./_client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Booking · StepNow Admin" };

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  return <BookingDetailClient id={params.id} />;
}
