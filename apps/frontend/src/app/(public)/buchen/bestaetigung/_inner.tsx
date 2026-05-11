// src/app/(public)/buchen/bestaetigung/_inner.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUiStrings } from "@/hooks/useUiStrings";
import { fetchSettings } from "@/services/settings";
import { ConfirmationView } from "@/components/features/booking";
import { Container } from "@/components/shared";
import type { Locale, SettingsPublic } from "@/types";

interface ConfirmationPageInnerProps {
  locale: Locale;
}

/**
 * Client component because we need to read the `ref` query string and
 * lazy-load settings (which we don't want to embed in the route handler's
 * static-prerender path — this page is noindex).
 */
export function ConfirmationPageInner({ locale }: ConfirmationPageInnerProps) {
  const { t } = useUiStrings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams?.get("ref") ?? "";
  const [settings, setSettings] = useState<SettingsPublic | null>(null);

  useEffect(() => {
    if (!reference) {
      // No reference means user got here some other way; bounce home.
      router.replace(locale === "de" ? "/" : "/en");
      return;
    }
    let cancelled = false;
    fetchSettings(locale)
      .then((s) => {
        if (!cancelled) setSettings(s);
      })
      .catch(() => {
        // Non-fatal — confirmation still works, just without phone CTA
      });
    return () => {
      cancelled = true;
    };
  }, [reference, locale, router]);

  if (!reference || !settings) {
    return (
      <Container className="py-section">
        <div className="mx-auto max-w-2xl">
          <div className="h-96 animate-pulse bg-line/30" aria-hidden="true" />
        </div>
      </Container>
    );
  }

  return <ConfirmationView t={t} locale={locale} reference={reference} settings={settings} />;
}
