// app/admin/(authed)/drivers/new/page.tsx
// New driver — full-page create form. Captures the §21 StVG / §48 FeV compliance record.

"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { DriverForm } from "../_form";

export default function NewDriverPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Operations"
        title="New driver"
        description="Add a courier / ride driver. Licence & P-Schein details enable §21 StVG dispatch-compliance tracking."
        actions={
          <Link href="/admin/drivers" className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" /> All drivers
          </Link>
        }
      />
      <div className="p-6"><DriverForm mode="create" /></div>
    </>
  );
}
