// apps/frontend/src/app/admin/(authed)/services/new/page.tsx
// New service create page.

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { ServiceForm } from "../[id]/_form";

export const metadata = { title: "New service · StepNow Admin" };

export default function NewServicePage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Services"
        title="New service"
        description="Pick a slug and add bilingual title + description."
        actions={
          <Link
            href="/admin/services"
            className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            All services
          </Link>
        }
      />
      <div className="p-6"><ServiceForm mode="create" /></div>
    </>
  );
}
