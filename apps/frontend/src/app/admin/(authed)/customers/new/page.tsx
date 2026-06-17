// app/admin/(authed)/customers/new/page.tsx
// New customer — full-page create form. AdminPageHeader + shared CustomerForm (rhf + zod).
// Single column — a customer record has no document to preview, unlike an order.

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { CustomerForm } from "../_form";

export const metadata = { title: "New customer · StepNow Admin" };

export default function NewCustomerPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Customers"
        title="New customer"
        description="Add a sender / biller for repeat courier jobs. Saved customers appear in the order builder's search."
        actions={
          <Link href="/admin/customers" className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" /> All customers
          </Link>
        }
      />
      <div className="p-6"><CustomerForm mode="create" /></div>
    </>
  );
}
