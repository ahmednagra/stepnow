// apps/frontend/src/app/admin/(authed)/testimonials/new/page.tsx
// Create new testimonial wrapper.

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { TestimonialForm } from "../[id]/_form";

export const metadata = { title: "New testimonial · StepNow Admin" };

export default function NewTestimonialPage() {
  return (
    <>
      <AdminPageHeader
        eyebrow="Testimonials"
        title="New testimonial"
        description="Add a customer quote — DE & EN are both required."
        actions={
          <Link
            href="/admin/testimonials"
            className="flex h-9 items-center gap-1.5 border border-slate-300 bg-white px-3 text-[12.5px] font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            All testimonials
          </Link>
        }
      />
      <div className="p-6"><TestimonialForm mode="create" /></div>
    </>
  );
}
