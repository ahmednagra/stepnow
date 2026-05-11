// src/app/admin/(authed)/testimonials/[id]/page.tsx
import { notFound } from "next/navigation";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { TestimonialAdmin } from "@/types";
import { AdminPageHeader } from "@/components/admin";
import { TestimonialForm } from "./_form";

export const dynamic = "force-dynamic";

async function load(id: string): Promise<TestimonialAdmin | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;
  const res = await serverApiClient.get<TestimonialAdmin>(
    ENDPOINTS.ADMIN.TESTIMONIAL_BY_ID(id),
    undefined,
    token,
  );
  return res.data ?? null;
}

export default async function TestimonialEditPage({ params }: { params: { id: string } }) {
  const t = await load(params.id);
  if (!t) notFound();
  return (
    <>
      <AdminPageHeader
        title={`${t.author_name}`}
        description={`Editing testimonial · source: ${t.source}`}
      />
      <div className="p-6">
        <TestimonialForm mode="edit" initial={t} />
      </div>
    </>
  );
}
