// apps/frontend/src/components/shared/SlugMapBridge.tsx

"use client";

import { useEffect } from "react";
import { useLocaleAlternatesStore } from "@/stores/useLocaleAlternatesStore";

interface SlugMapBridgeProps {
  /**
   * Map from current-locale pathname → other-locale pathname. Pages
   * typically supply one entry (for the page being viewed); the
   * LanguageSwitcher only ever looks up the current path.
   */
  slugMap: Record<string, string>;
}

export function SlugMapBridge({ slugMap }: SlugMapBridgeProps) {
  const setSlugMap = useLocaleAlternatesStore((s) => s.setSlugMap);
  const clearSlugMap = useLocaleAlternatesStore((s) => s.clearSlugMap);

  useEffect(() => {
    setSlugMap(slugMap);
    return () => clearSlugMap();
  }, [JSON.stringify(slugMap)]);

  return null;
}