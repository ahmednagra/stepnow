// src/app/admin/layout.tsx
// Admin ROOT layout (<html lang="en">, see app/root-document.tsx). No auth check here — that lives
// in (authed)/layout.tsx so the login page (which sits at /admin/login) doesn't get caught.
// Scopes admin pages out of the public site's Header/Footer; the admin UI is English.

import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootDocument, ROOT_VIEWPORT, SHARED_ROOT_METADATA } from "../root-document";

export const viewport = ROOT_VIEWPORT;

export const metadata: Metadata = {
  ...SHARED_ROOT_METADATA,
  title: "StepNow Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <RootDocument lang="en">
      <div className="font-sans">{children}</div>
    </RootDocument>
  );
}
