// apps/frontend/src/app/en/not-found.tsx
// EN 404 inside the EN root layout. Reached by notFound() anywhere below and, for unmatched URLs,
// through [...notFound]/page.tsx.

import { NotFoundView } from "@/components/shared";

export default function NotFound() {
  return <NotFoundView />;
}
