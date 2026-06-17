// apps/frontend/src/app/admin/(authed)/settings/page.tsx
// Server shell — metadata only. Data is fetched client-side via React Query (bearer auth).

import type { Metadata } from "next";
import { SettingsClient } from "./_client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Business settings · StepNow Admin" };

export default function SettingsPage() {
  return <SettingsClient />;
}
