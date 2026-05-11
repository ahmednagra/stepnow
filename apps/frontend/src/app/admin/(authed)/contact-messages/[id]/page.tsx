// src/app/admin/(authed)/contact-messages/[id]/page.tsx
import { notFound } from "next/navigation";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { ContactMessageAdmin } from "@/types";
import { AdminPageHeader } from "@/components/admin";
import { ContactMessageDetail } from "./_detail";

export const dynamic = "force-dynamic";

async function load(id: string): Promise<ContactMessageAdmin | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;
  const res = await serverApiClient.get<ContactMessageAdmin>(
    ENDPOINTS.ADMIN.CONTACT_MESSAGE_BY_ID(id),
    undefined,
    token,
  );
  return res.data ?? null;
}

export default async function ContactMessageDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const m = await load(params.id);
  if (!m) notFound();
  return (
    <>
      <AdminPageHeader
        title={`Message from ${m.name}`}
        description={`${m.subject_category} · ${m.email}`}
      />
      <div className="p-6">
        <ContactMessageDetail initial={m} />
      </div>
    </>
  );
}
