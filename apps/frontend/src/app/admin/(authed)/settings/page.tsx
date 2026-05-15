// apps/frontend/src/app/admin/(authed)/settings/page.tsx
// Business settings - reuses existing SettingsForm with refined header.

import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { SettingsAdmin } from "@/types";
import { AdminPageHeader, AdminCard } from "@/components/admin";
import { SettingsForm } from "./_form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Business settings · StepNow Admin" };

async function loadSettings(): Promise<SettingsAdmin | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;
  const res = await serverApiClient.get<SettingsAdmin>(ENDPOINTS.ADMIN.SETTINGS, undefined, token);
  return res.data ?? null;
}

export default async function SettingsPage() {
  const settings = await loadSettings();
  if (!settings) {
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
