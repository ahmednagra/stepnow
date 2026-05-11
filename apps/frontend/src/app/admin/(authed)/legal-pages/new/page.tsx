// src/app/admin/(authed)/legal-pages/new/page.tsx
import { AdminPageHeader } from "@/components/admin";
import { NewLegalPageForm } from "./_form";

export default function NewLegalPagePage() {
  return (
    <>
      <AdminPageHeader
        title="New legal page"
        description="Pick a slug. You can edit titles and bodies after creating the page."
      />
      <div className="p-6">
        <NewLegalPageForm />
      </div>
    </>
  );
}
