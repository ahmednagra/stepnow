// apps/frontend/src/app/admin/(authed)/contact-messages/[id]/page.tsx
// Contact message detail wrapper - server fetch and feed to detail client.

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { ContactMessageAdmin } from "@/types";
import { AdminPageHeader } from "@/components/admin";
import { MessageDetail } from "./_detail";

export const dynamic = "force-dynamic";

async function loadMessage(id: string): Promise<ContactMessageAdmin | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;
  const res = await serverApiClient.get<ContactMessageAdmin>(
    ENDPOINTS.ADMIN.CONTACT_MESSAGE_BY_ID(id), undefined, token,
  );
  return res.data ?? null;
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const m = await loadMessage(params.id);
  return { title: m ? `${m.name} · Messages · StepNow Admin` : "Message · StepNow Admin" };
}

export default async function ContactMessageDetailPage({ params }: { params: { id: string } }) {
  const m = await loadMessage(params.id);
  if (!m) notFound();
  return (
    <>
      <AdminPageHeader
        eyebrow={`Message · ${m.subject_category}`}
        title={m.name}
        description={m.email}
        actions={
          <Link
            href="/admin/contact-messages"
            className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            All messages
          </Link>
        }
      />
      <div className="p-6"><MessageDetail initial={m} /></div>
    </>
  );
}
