// src/app/providers.tsx
// Client providers shell. Mounts the React Query client (one per browser session) and reports
// Core Web Vitals via the built-in Next hook. The QueryClient is created once with useState so
// it survives re-renders but is never shared across requests on the server.

"use client";

import { useReportWebVitals } from "next/web-vitals";
import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/react-query";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());

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

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
