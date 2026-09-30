// apps/frontend/src/app/(public)/auftrag-erstellen/layout.tsx
// Staff-only order form (gated by the staff access code): never indexed, no canonical or hreflang
// inherited from the public layout, and no EN mirror (absent from ROUTE_MAP, so the language
// switcher does not offer one). Also disallowed in robots.ts.

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: null, languages: {} },
};

export default function StaffOrderLayout({ children }: { children: ReactNode }) {
  return children;
}
