// apps/frontend/src/app/(public)/error.tsx
// Error boundary for DE pages — inside the DE root layout, so header, footer and ui strings remain.

"use client";

import { LocalizedErrorView } from "@/components/shared";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <LocalizedErrorView error={error} reset={reset} />;
}
