// src/app/admin/(authed)/testimonials/new/page.tsx
import { AdminPageHeader } from "@/components/admin";
import { TestimonialForm } from "../[id]/_form";

export default function NewTestimonialPage() {
  return (
    <>
      <AdminPageHeader title="New testimonial" description="Add a customer quote." />
      <div className="p-6">
        <TestimonialForm mode="create" />
      </div>
    </>
  );
}
