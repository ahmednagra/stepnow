// apps/frontend/src/components/consent/ConsentHydrator.tsx
// Client-only side-effect component that hydrates the consent store from the cookie on mount.
"use client";
import { useEffect } from "react";
import { useConsentStore } from "@/stores/useConsentStore";

export function ConsentHydrator() {
  const hydrate = useConsentStore((s) => s.hydrate);
  useEffect(() => { hydrate(); }, [hydrate]);
  return null;
}
