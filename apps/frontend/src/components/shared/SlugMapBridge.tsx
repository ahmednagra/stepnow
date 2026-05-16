// apps/frontend/src/components/shared/SlugMapBridge.tsx

"use client";

import { useEffect } from "react";
import { useLocaleAlternatesStore } from "@/stores/useLocaleAlternatesStore";

interface SlugMapBridgeProps {
  slugMap: Record<string, string>;
}

export function SlugMapBridge({ slugMap }: SlugMapBridgeProps) {
  const current = useLocaleAlternatesStore.getState().slugMap;
  let same = true;
  const incomingKeys = Object.keys(slugMap);
  const currentKeys = Object.keys(current);
  if (incomingKeys.length !== currentKeys.length) {
    same = false;
  } else {
    for (const k of incomingKeys) {
      if (current[k] !== slugMap[k]) { same = false; break; }
    }
  }
  if (!same) {
    useLocaleAlternatesStore.getState().setSlugMap(slugMap);
  }

  const clearSlugMap = useLocaleAlternatesStore((s) => s.clearSlugMap);
  useEffect(() => {
    return () => clearSlugMap();
  }, [clearSlugMap]);

  return null;
}