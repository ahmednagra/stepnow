// src/app/admin/(authed)/services/new/page.tsx
import { AdminPageHeader } from "@/components/admin";
import { ServiceForm } from "../[id]/_form";

export default function NewServicePage() {
  return (
    <>
      <AdminPageHeader title="New service" description="Create a new service category." />
      <div className="p-6">
        <ServiceForm mode="create" />
      </div>
    </>
  );
}
