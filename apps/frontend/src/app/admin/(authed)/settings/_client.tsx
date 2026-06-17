// apps/frontend/src/app/admin/(authed)/settings/_client.tsx
// Client island: fetches business settings via React Query (browser bearer auth).

"use client";

import { AdminPageHeader, AdminCard } from "@/components/admin";
import { SettingsForm } from "./_form";
import { useSettings } from "@/hooks/queries";

export function SettingsClient() {
  const { data: settings, isLoading, isError } = useSettings();
  if (isLoading) {
    return (
      <>
        <AdminPageHeader eyebrow="System" title="Business settings" />
        <div className="p-6 text-[13px] text-slate-500">Loading…</div>
      </>
    );
  }
  if (isError || !settings) {
    return (
      <>
        <AdminPageHeader eyebrow="System" title="Business settings" />
        <div className="p-6">
          <AdminCard><p className="text-sm text-red-600">Could not load settings.</p></AdminCard>
        </div>
      </>
    );
  }
  return (
    <>
      <AdminPageHeader
        eyebrow="System"
        title="Business settings"
        description="Contact info, legal credentials, social links, and SEO defaults shown across the public site."
      />
      <div className="p-6"><SettingsForm initial={settings} /></div>
    </>
  );
}
