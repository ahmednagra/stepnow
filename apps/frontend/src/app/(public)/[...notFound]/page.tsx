// apps/frontend/src/app/(public)/[...notFound]/page.tsx
// Catch-all for URLs no route matches, so they render this root's localized not-found.tsx (with
// its layout) instead of Next's unstyled built-in 404 — with multiple root layouts there is no
// app-level not-found. Static routes and public files still take precedence.

import { notFound } from "next/navigation";

export default function UnmatchedRoute() {
  notFound();
}
