// src/app/admin/layout.tsx
// Outer admin layout. No auth check here — that lives in (authed)/layout.tsx
// so the login page (which sits at /admin/login) doesn't get caught.
//
// This file exists mainly to scope admin pages out of the public site's
// Header/Footer and to override the language to English.

import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "StepNow Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <div className="font-sans">{children}</div>;
}
