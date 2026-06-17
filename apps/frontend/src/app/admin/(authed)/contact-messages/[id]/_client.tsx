// apps/frontend/src/app/admin/(authed)/contact-messages/[id]/_client.tsx
// Client island: fetches the contact message via React Query (browser bearer auth).

"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { MessageDetail } from "./_detail";
import { useContactMessage } from "@/hooks/queries";

export function ContactMessageDetailClient({ id }: { id: string }) {
  const { data: m, isLoading, isError } = useContactMessage(id);
  if (isLoading) return <div className="p-6 text-[13px] text-slate-500">Loading…</div>;
  if (isError || !m) notFound();
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
