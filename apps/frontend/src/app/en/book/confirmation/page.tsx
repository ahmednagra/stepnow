// src/app/en/book/confirmation/page.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmationPageInner } from "./_inner";

export const metadata: Metadata = {
  title: "Booking request received",
  robots: { index: false, follow: false },
};

export default function ConfirmationPageEn() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <ConfirmationPageInner locale="en" />
    </Suspense>
  );
}
