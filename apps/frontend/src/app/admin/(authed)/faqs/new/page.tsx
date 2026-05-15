// apps/frontend/src/app/admin/(authed)/faqs/new/page.tsx
// Create new FAQ wrapper.

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { FaqForm } from "../[id]/_form";

export const metadata = { title: "New FAQ · StepNow Admin" };

export default function NewFaqPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="FAQs"
        title="New FAQ"
        description="Add a question and answer — DE & EN are both required."
        actions={
          <Link
            href="/admin/faqs"
            className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            All FAQs
          </Link>
        }
      />
      <div className="p-6"><FaqForm mode="create" /></div>
    </>
  );
}
