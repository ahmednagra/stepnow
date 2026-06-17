// apps/frontend/src/app/admin/(authed)/page.tsx
// Server shell — metadata only. Dashboard data is fetched client-side via React Query (bearer auth).

import type { Metadata } from "next";
import { DashboardClient } from "./_dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Dashboard · StepNow Admin",
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
