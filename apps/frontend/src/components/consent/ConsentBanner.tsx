// apps/frontend/src/components/consent/ConsentBanner.tsx
// DSGVO consent banner: three equal-weight buttons (Accept / Reject / Customise) with a category drawer.
"use client";
import { memo, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useConsentDecided, useConsentHydrated, useConsentStore } from "@/stores/useConsentStore";
import type { ConsentState } from "@/lib/consent/types";
import { useUiStrings } from "@/hooks/useUiStrings";
import { pickT } from "@/lib/i18n/pick";

function ConsentBannerImpl() {
  const hydrated = useConsentHydrated();
  const decided = useConsentDecided();
  const acceptAll = useConsentStore((s) => s.acceptAll);
  const rejectAll = useConsentStore((s) => s.rejectAll);
  const save = useConsentStore((s) => s.save);
  const { t, locale } = useUiStrings();
  const [showDetails, setShowDetails] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [draft, setDraft] = useState<ConsentState>({ maps: false, fonts: false, analytics: false });
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!showDetails) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowDetails(false); };
    window.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [showDetails]);

  const onCustomise = useCallback(() => setShowDetails(true), []);
  const onSaveDraft = useCallback(() => { save(draft); setShowDetails(false); }, [draft, save]);
  const toggle = useCallback((k: keyof ConsentState) => setDraft((d) => ({ ...d, [k]: !d[k] })), []);

  if (!mounted || !hydrated || decided) return null;

  const link = locale === "de" ? "/datenschutz" : "/en/privacy";
  const node = (
    <div className="fixed inset-x-0 bottom-0 z-[9999] border-t border-line bg-cream shadow-[0_-4px_24px_rgba(0,0,0,0.08)]" role="region" aria-label={pickT(t, "consent.region", "Cookie-Einstellungen")}>
      <div className="mx-auto max-w-container px-6 py-5 md:px-12 lg:px-16">
        {!showDetails ? (
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="flex-1">
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-gold-deep">{pickT(t, "consent.eyebrow", "Cookies")}</p>
              <p className="mt-1 text-[14px] leading-relaxed text-ink">
                {pickT(t, "consent.body", "Wir nutzen technisch notwendige Cookies. Mit Ihrer Einwilligung binden wir auch Google Maps, Google Fonts und Analytics ein.")}{" "}
                <a href={link} className="underline decoration-gold underline-offset-2 hover:text-gold-deep">{pickT(t, "consent.privacy_link", "Datenschutz")}</a>
              </p>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:gap-3">
              <button type="button" onClick={rejectAll} className="border border-ink/15 bg-cream px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink hover:bg-ink/5">{pickT(t, "consent.reject_all", "Alle ablehnen")}</button>
              <button type="button" onClick={onCustomise} className="border border-ink/15 bg-cream px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink hover:bg-ink/5">{pickT(t, "consent.customise", "Anpassen")}</button>
              <button type="button" onClick={acceptAll} className="bg-ink px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-cream hover:bg-gold-deep">{pickT(t, "consent.accept_all", "Alle akzeptieren")}</button>
            </div>
          </div>
        ) : (
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="outline-none">
            <h2 id={titleId} className="font-serif text-[20px] tracking-tight text-ink">{pickT(t, "consent.dialog.title", "Cookie-Einstellungen anpassen")}</h2>
            <p className="mt-1 text-[13px] text-mute">{pickT(t, "consent.dialog.intro", "Technisch notwendige Cookies sind immer aktiv. Wählen Sie zusätzlich aus:")}</p>
            <ul className="mt-4 flex flex-col divide-y divide-line border-y border-line">
              <CategoryRow label={pickT(t, "consent.cat.maps.label", "Google Maps")} desc={pickT(t, "consent.cat.maps.desc", "Karte auf Kontakt- und Über-uns-Seite. Überträgt Ihre IP an Google in den USA.")} checked={draft.maps} onChange={() => toggle("maps")} />
              <CategoryRow label={pickT(t, "consent.cat.fonts.label", "Google Fonts")} desc={pickT(t, "consent.cat.fonts.desc", "Schriftarten von Google-Servern. Ohne Einwilligung nutzen wir selbst gehostete Schriften.")} checked={draft.fonts} onChange={() => toggle("fonts")} />
              <CategoryRow label={pickT(t, "consent.cat.analytics.label", "Google Analytics (GA4)")} desc={pickT(t, "consent.cat.analytics.desc", "Anonymisierte Reichweitenmessung. Hilft uns, die Seite zu verbessern.")} checked={draft.analytics} onChange={() => toggle("analytics")} />
            </ul>
            <div className="mt-5 flex flex-col gap-2 md:flex-row md:justify-end md:gap-3">
              <button type="button" onClick={() => setShowDetails(false)} className="border border-ink/15 bg-cream px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-ink hover:bg-ink/5">{pickT(t, "consent.dialog.back", "Zurück")}</button>
              <button type="button" onClick={onSaveDraft} className="bg-ink px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-cream hover:bg-gold-deep">{pickT(t, "consent.dialog.save", "Auswahl speichern")}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

interface RowProps { label: string; desc: string; checked: boolean; onChange: () => void }
const CategoryRow = memo(function CategoryRow({ label, desc, checked, onChange }: RowProps) {
  return (
    <li className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <p className="text-[13px] font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-mute">{desc}</p>
      </div>
      <label className="relative inline-flex shrink-0 cursor-pointer items-center" aria-label={label}>
        <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
        <span className="h-5 w-9 rounded-full bg-line transition-colors peer-checked:bg-gold-deep" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-cream transition-transform peer-checked:translate-x-4" />
      </label>
    </li>
  );
});

export const ConsentBanner = memo(ConsentBannerImpl);
