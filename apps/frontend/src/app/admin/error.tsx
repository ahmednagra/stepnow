// apps/frontend/src/app/admin/error.tsx
// Error boundary for the admin area (English UI, like every admin page).

"use client";

import { ErrorView } from "@/components/shared";

const COPY = {
  eyebrow: "Error",
  heading: "Something went wrong",
  body: "This page could not be loaded. Please try again.",
  retry: "Try again",
};

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView copy={COPY} error={error} reset={reset} />;
}
