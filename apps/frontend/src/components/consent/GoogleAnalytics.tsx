// apps/frontend/src/components/consent/GoogleAnalytics.tsx
// Loads GA4 with Consent Mode v2 (denied by default, granted only after analytics consent).
"use client";
import { memo, useEffect } from "react";
import Script from "next/script";
import { useAnalyticsConsent } from "@/stores/useConsentStore";

const GA_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function GoogleAnalyticsImpl() {
  const allowed = useAnalyticsConsent();

  useEffect(() => {
    if (typeof window === "undefined" || !GA_ID) return;
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) window.gtag = (...args) => window.dataLayer!.push(args);
    window.gtag("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: allowed ? "granted" : "denied",
    });
  }, [allowed]);

  if (!GA_ID) return null;

  return (
    <>
      <Script id="ga4-consent-default" strategy="beforeInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});`}</Script>
      <Script id="ga4-loader" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">{`gtag('js',new Date());gtag('config','${GA_ID}',{anonymize_ip:true});`}</Script>
    </>
  );
}

export const GoogleAnalytics = memo(GoogleAnalyticsImpl);
