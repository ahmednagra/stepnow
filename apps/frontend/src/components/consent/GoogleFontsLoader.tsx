// apps/frontend/src/components/consent/GoogleFontsLoader.tsx
// Injects Google Fonts <link> tags only after consent; self-hosted next/font remains the pre-consent fallback.
"use client";
import { memo, useEffect } from "react";
import { useFontsConsent } from "@/stores/useConsentStore";

const PRECONNECT_HOSTS = ["https://fonts.googleapis.com", "https://fonts.gstatic.com"];
const STYLESHEET_HREF = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700&display=swap";
const SENTINEL_ATTR = "data-sn-gfonts";

function inject() {
  if (typeof document === "undefined") return;
  if (document.querySelector(`link[${SENTINEL_ATTR}]`)) return;
  for (const href of PRECONNECT_HOSTS) {
    const l = document.createElement("link");
    l.rel = "preconnect";
    l.href = href;
    l.crossOrigin = "anonymous";
    l.setAttribute(SENTINEL_ATTR, "preconnect");
    document.head.appendChild(l);
  }
  const sheet = document.createElement("link");
  sheet.rel = "stylesheet";
  sheet.href = STYLESHEET_HREF;
  sheet.setAttribute(SENTINEL_ATTR, "stylesheet");
  document.head.appendChild(sheet);
}

function remove() {
  if (typeof document === "undefined") return;
  document.querySelectorAll(`link[${SENTINEL_ATTR}]`).forEach((n) => n.remove());
}

function GoogleFontsLoaderImpl() {
  const allowed = useFontsConsent();
  useEffect(() => {
    if (allowed) inject(); else remove();
  }, [allowed]);
  return null;
}

export const GoogleFontsLoader = memo(GoogleFontsLoaderImpl);
