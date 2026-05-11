// src/app/admin/(authed)/ui-strings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin";
import { UiStringsTable } from "./_table";

export default function UiStringsPage() {
  const [showCreate, setShowCreate] = useState(false);
  // bump key on create to force the table to reload
  const [refreshKey, setRefreshKey] = useState(0);

  // Allow the table to expose a "new" trigger
  useEffect(() => {
    function onNew() {
      setShowCreate(true);
    }
    window.addEventListener("admin:new-ui-string", onNew);
    return () => window.removeEventListener("admin:new-ui-string", onNew);
  }, []);

  return (
    <>
      <AdminPageHeader
        title="UI strings"
        description="Translatable strings shown on the public site. Click any value to edit inline."
        actions={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex h-9 items-center gap-1.5 bg-slate-900 px-3 text-[13px] font-medium text-white transition-colors hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New string
          </button>
        }
      />
      <div className="p-6">
        <UiStringsTable
          key={refreshKey}
          showCreate={showCreate}
          onCreateClose={(created) => {
            setShowCreate(false);
            if (created) setRefreshKey((k) => k + 1);
          }}
        />
      </div>
    </>
  );
}
