// src/app/providers.tsx
// Client providers shell; reports Core Web Vitals via the built-in Next hook.

"use client";

import { useReportWebVitals } from "next/web-vitals";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.info("[web-vitals]", metric.name, Math.round(metric.value), metric.rating);
      return;
    }
    const url = process.env.NEXT_PUBLIC_WEB_VITALS_URL;
    if (!url || typeof navigator === "undefined") return;
    const body = JSON.stringify({
      name: metric.name, value: metric.value, rating: metric.rating,
      id: metric.id, path: window.location.pathname,
    });
    if (typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(url, body);
    } else {
      fetch(url, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  });
  return <>{children}</>;
}
