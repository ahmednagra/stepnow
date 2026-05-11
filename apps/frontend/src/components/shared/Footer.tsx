// apps/frontend/src/components/shared/Footer.tsx
// Phase 3d polish — refined column hierarchy, gold hairline accents on column
// headings, opening-hours block, and concession line in the bottom strip
// (audit §11.2 — "Final CTA / footer"). Matches website-outline.md §1.12.

"use client";

import Link from "next/link";
import { useUiStrings } from "@/hooks/useUiStrings";
import { Container } from "./Container";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { SettingsPublic } from "@/types";
import { toTelHref } from "@/utils/formatters";
import { Logo } from "./Logo";

interface FooterProps {
  settings: SettingsPublic;
}

interface FooterLink {
  key: string;
  hrefDe: string;
  hrefEn: string;
}

const QUICK_LINKS: FooterLink[] = [
  { key: "nav.home", hrefDe: "/", hrefEn: "/en" },
  { key: "nav.about", hrefDe: "/ueber-uns", hrefEn: "/en/about" },
  { key: "nav.pricing", hrefDe: "/preise", hrefEn: "/en/pricing" },
  { key: "nav.contact", hrefDe: "/kontakt", hrefEn: "/en/contact" },
];

const SERVICE_LINKS: FooterLink[] = [
  {
    key: "services.flughafentransfer",
    hrefDe: "/dienstleistungen/flughafentransfer",
    hrefEn: "/en/services/airport-transfer",
  },
  {
    key: "services.krankenhausfahrten",
    hrefDe: "/dienstleistungen/krankenhausfahrten",
    hrefEn: "/en/services/hospital-transport",
  },
  {
    key: "services.schuelerbefoerderung",
    hrefDe: "/dienstleistungen/schuelerbefoerderung",
    hrefEn: "/en/services/school-transport",
  },
  {
    key: "services.shuttle",
    hrefDe: "/dienstleistungen/shuttle-service",
    hrefEn: "/en/services/shuttle-service",
  },
];

const LEGAL_LINKS: FooterLink[] = [
  { key: "footer.legal.impressum", hrefDe: "/impressum", hrefEn: "/en/legal-notice" },
  { key: "footer.legal.datenschutz", hrefDe: "/datenschutz", hrefEn: "/en/privacy" },
  { key: "footer.legal.agb", hrefDe: "/agb", hrefEn: "/en/terms" },
];

function cleanBusinessName(name: string): string {
  return name.replace(/\s*\(Dev\)\s*$/i, "").trim();
}

export function Footer({ settings }: FooterProps) {
  const { t, locale } = useUiStrings();
  const hrefFor = (item: FooterLink) => (locale === "de" ? item.hrefDe : item.hrefEn);
  const displayName = cleanBusinessName(settings.business_name);

  return (
    <footer className="border-t border-cream/10 bg-ink text-cream">
      <Container as="div" className="grid gap-12 py-20 md:grid-cols-12 md:py-24">
        {/* Brand column */}
        <div className="md:col-span-4">
          <div className="inline-flex items-center bg-cream px-4 py-3">
            <Logo height={40} />
          </div>
          <p className="mt-7 max-w-xs text-[14px] leading-relaxed text-cream/60">
            {t("footer.col.brand")}
          </p>
          {/* Concession line — strongest trust signal in footer (audit H-1). */}
          {settings.concession_number && (
            <p className="mt-6 inline-block border-t border-gold/30 pt-3 text-[11px] uppercase tracking-[0.22em] text-gold">
              § 49 PBefG · {settings.concession_number}
            </p>
          )}
        </div>

        {/* Quick links */}
        <div className="md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            {t("footer.col.quick_links")}
          </p>
          <span className="mt-2 block h-px w-6 bg-gold/40" aria-hidden="true" />
          <ul className="mt-5 space-y-3">
            {QUICK_LINKS.map((item) => (
              <li key={item.key}>
                <Link
                  href={hrefFor(item)}
                  className="text-[13px] text-cream/75 transition-colors duration-base hover:text-gold"
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div className="md:col-span-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            {t("footer.col.services")}
          </p>
          <span className="mt-2 block h-px w-6 bg-gold/40" aria-hidden="true" />
          <ul className="mt-5 space-y-3">
            {SERVICE_LINKS.map((item) => (
              <li key={item.key}>
                <Link
                  href={hrefFor(item)}
                  className="text-[13px] text-cream/75 transition-colors duration-base hover:text-gold"
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div className="md:col-span-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            {t("footer.col.contact")}
          </p>
          <span className="mt-2 block h-px w-6 bg-gold/40" aria-hidden="true" />
          <address className="mt-5 space-y-1 not-italic text-[13px] leading-relaxed text-cream/75">
            <p>{settings.address_street}</p>
            <p>
              {settings.address_postcode} {settings.address_city}
            </p>
            <p className="mt-3">
              <a
                href={toTelHref(settings.phone)}
                className="tabular-nums transition-colors duration-base hover:text-gold"
              >
                {settings.phone}
              </a>
            </p>
            <p>
              <a
                href={`mailto:${settings.email}`}
                className="transition-colors duration-base hover:text-gold"
              >
                {settings.email}
              </a>
            </p>
          </address>
        </div>
      </Container>

      {/* Bottom strip */}
      <div className="border-t border-cream/10">
        <Container
          as="div"
          className="flex flex-col items-start justify-between gap-4 py-6 md:flex-row md:items-center"
        >
          <p className="text-[11px] tracking-wide text-cream/45">
            © {new Date().getFullYear()} {displayName}. {t("footer.copyright")}
          </p>
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {LEGAL_LINKS.map((item) => (
              <li key={item.key}>
                <Link
                  href={hrefFor(item)}
                  className="text-[11px] tracking-wide text-cream/55 transition-colors duration-base hover:text-gold"
                >
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
          <LanguageSwitcher className="text-cream" />
        </Container>
      </div>
    </footer>
  );
}
