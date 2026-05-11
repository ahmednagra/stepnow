// src/app/admin/(authed)/faqs/[id]/page.tsx
import { notFound } from "next/navigation";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { FaqAdmin } from "@/types";
import { AdminPageHeader } from "@/components/admin";
import { FaqForm } from "./_form";

export const dynamic = "force-dynamic";

async function load(id: string): Promise<FaqAdmin | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;
  const res = await serverApiClient.get<FaqAdmin>(
    ENDPOINTS.ADMIN.FAQ_BY_ID(id),
    undefined,
    token,
  );
  return res.data ?? null;
}

export default async function FaqEditPage({ params }: { params: { id: string } }) {
  const q = await load(params.id);
  if (!q) notFound();
  return (
    <>
      <AdminPageHeader title={q.question_de} description={`Editing FAQ · ${q.category}`} />
      <div className="p-6">
        <FaqForm mode="edit" initial={q} />
      </div>
    </>
  );
}
