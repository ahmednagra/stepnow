// apps/frontend/src/app/admin/(authed)/testimonials/[id]/page.tsx
// Server shell — metadata only. Data is fetched client-side via React Query (bearer auth).

import type { Metadata } from "next";
import { TestimonialEditClient } from "./_client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Testimonial · StepNow Admin" };

export default function TestimonialEditPage({ params }: { params: { id: string } }) {
  return <TestimonialEditClient id={params.id} />;
}
