// apps/frontend/src/components/consent/ConsentBanner.tsx
// DSGVO/TTDSG § 25 consent banner. The site's only consent-bound request is the OpenStreetMap map,
// so there is one decision with two identically styled buttons (decline / allow) — no pre-ticked boxes,
// no nudging. Shown until decided; the footer "Cookie-Einstellungen" link reopens it.
"use client";
import { memo, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useConsentDecided, useConsentHydrated, useConsentStore } from "@/stores/useConsentStore";
import { useUiStrings } from "@/hooks/useUiStrings";
import { pickT } from "@/lib/i18n/pick";

const BUTTON =
  "min-w-[150px] border border-[var(--color-text-primary)] bg-[var(--color-text-primary)] px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-on-strong)] transition-colors duration-base hover:bg-[var(--color-accent-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent-primary)]";

function ConsentBannerImpl() {
  const hydrated = useConsentHydrated();
  const decided = useConsentDecided();
  const acceptAll = useConsentStore((s) => s.acceptAll);
  const rejectAll = useConsentStore((s) => s.rejectAll);
  const { t, locale } = useUiStrings();
  const [mounted, setMounted] = useState(false);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => setMounted(true), []);

  if (!mounted || !hydrated || decided) return null;

  return createPortal(
    <section
      role="region"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      className="fixed inset-x-0 bottom-0 z-[9999] border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] shadow-[0_-4px_24px_rgba(0,0,0,0.08)]"
    >
      <div className="mx-auto flex max-w-container flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:gap-8 md:px-12 lg:px-16">
        <div className="flex-1">
          <h2 id={titleId} className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-primary)]">
            {pickT(t, "consent.eyebrow", locale === "de" ? "Datenschutz" : "Privacy")}
          </h2>
          <p id={bodyId} className="mt-1 text-[14px] leading-relaxed text-[var(--color-text-primary)]">
            {pickT(
              t,
              "consent.body",
              locale === "de"
                ? "Wir setzen nur technisch notwendige Cookies. Die Karte laden wir erst mit Ihrer Einwilligung von OpenStreetMap — dabei wird Ihre IP-Adresse übertragen."
                : "We only use strictly necessary cookies. The map is loaded from OpenStreetMap only with your consent — this transmits your IP address.",
            )}{" "}
            <a
              href={locale === "de" ? "/datenschutz" : "/en/privacy"}
              className="underline decoration-[var(--color-accent-primary)] underline-offset-2 hover:text-[var(--color-accent-primary)]"
            >
              {pickT(t, "consent.privacy_link", locale === "de" ? "Datenschutzerklärung" : "Privacy policy")}
            </a>
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <button type="button" onClick={rejectAll} className={BUTTON}>
            {pickT(t, "consent.reject_all", locale === "de" ? "Ablehnen" : "Decline")}
          </button>
          <button type="button" onClick={acceptAll} className={BUTTON}>
            {pickT(t, "consent.accept_all", locale === "de" ? "Karte erlauben" : "Allow map")}
          </button>
        </div>
      </div>
    </section>,
    document.body,
  );
}

export const ConsentBanner = memo(ConsentBannerImpl);
