// src/components/shared/Footer.tsx
"use client";

import Link from "next/link";
import { useUiStrings } from "@/hooks/useUiStrings";
import { Container } from "./Container";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { SettingsPublic } from "@/types";

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

export function Footer({ settings }: FooterProps) {
  const { t, locale } = useUiStrings();
  const hrefFor = (item: FooterLink) => (locale === "de" ? item.hrefDe : item.hrefEn);

  return (
    <footer className="border-t border-line bg-ink text-cream">
      <Container as="div" className="grid gap-10 py-section md:grid-cols-4">
        <div>
          <p className="font-serif text-lg">{settings.business_name}</p>
          <p className="mt-2 text-sm text-cream/70">{t("footer.col.brand")}</p>
        </div>

        <div>
          <p className="label-eyebrow !text-cream/70">{t("footer.col.quick_links")}</p>
          <ul className="mt-3 space-y-2">
            {QUICK_LINKS.map((item) => (
              <li key={item.key}>
                <Link href={hrefFor(item)} className="text-sm text-cream/80 hover:text-gold">
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="label-eyebrow !text-cream/70">{t("footer.col.services")}</p>
          <ul className="mt-3 space-y-2">
            {SERVICE_LINKS.map((item) => (
              <li key={item.key}>
                <Link href={hrefFor(item)} className="text-sm text-cream/80 hover:text-gold">
                  {t(item.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="label-eyebrow !text-cream/70">{t("footer.col.contact")}</p>
          <address className="mt-3 space-y-1 not-italic text-sm text-cream/80">
            <p>{settings.address_street}</p>
            <p>
              {settings.address_postcode} {settings.address_city}
            </p>
            <p>
              <a href={`tel:${settings.phone.replace(/[^\d+]/g, "")}`} className="hover:text-gold">
                {settings.phone}
              </a>
            </p>
            <p>
              <a href={`mailto:${settings.email}`} className="hover:text-gold">
                {settings.email}
              </a>
            </p>
          </address>
        </div>
      </Container>

      <div className="border-t border-cream/10">
        <Container as="div" className="flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <p className="text-xs text-cream/60">{t("footer.copyright")}</p>
          <ul className="flex flex-wrap items-center gap-4">
            {LEGAL_LINKS.map((item) => (
              <li key={item.key}>
                <Link href={hrefFor(item)} className="text-xs text-cream/70 hover:text-gold">
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
