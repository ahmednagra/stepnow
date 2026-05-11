// src/app/(public)/buchen/bestaetigung/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmationPageInner } from "./_inner";

export const metadata: Metadata = {
  title: "Buchungsanfrage gesendet",
  robots: { index: false, follow: false },
};

export default function ConfirmationPageDe() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <ConfirmationPageInner locale="de" />
    </Suspense>
  );
}
