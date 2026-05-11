// src/app/admin/(authed)/faqs/new/page.tsx
import { AdminPageHeader } from "@/components/admin";
import { FaqForm } from "../[id]/_form";

export default function NewFaqPage() {
  return (
    <>
      <AdminPageHeader title="New FAQ" description="Add a question and answer." />
      <div className="p-6">
        <FaqForm mode="create" />
      </div>
    </>
  );
}
