// apps/frontend/src/app/(public)/not-found.tsx
// DE 404 inside the DE root layout. Reached by notFound() anywhere below and, for unmatched URLs,
// through [...notFound]/page.tsx.

import { NotFoundView } from "@/components/shared";

export default function NotFound() {
  return <NotFoundView />;
}
