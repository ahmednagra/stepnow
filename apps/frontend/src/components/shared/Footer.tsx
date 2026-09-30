"use client";

import Link from "next/link";
import { useUiStrings } from "@/hooks/useUiStrings";
import { Container } from "./Container";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { WhatsAppIcon } from "./WhatsAppIcon";
import type { SettingsPublic } from "@/types";
import { toTelHref } from "@/utils/formatters";
import { pickT } from "@/lib/i18n/pick";
import { cn } from "@/utils/cn";
import { ConsentSettingsButton } from "@/components/consent";

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
  { key: "footer.legal.impressum", hrefDe: "/impressum", hrefEn: "/en/legal-notice" },
  { key: "nav.pricing", hrefDe: "/preise", hrefEn: "/en/pricing" },
  { key: "nav.contact", hrefDe: "/kontakt", hrefEn: "/en/contact" },
  { key: "nav.faq", hrefDe: "/faq", hrefEn: "/en/faq" },
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
    key: "services.shuttle",
    hrefDe: "/dienstleistungen/shuttle-service",
    hrefEn: "/en/services/shuttle-service",
  },
  {
    key: "services.courier",
    hrefDe: "/dienstleistungen/kurier-sondertransport",
    hrefEn: "/en/services/courier-transport",
  },
];

const LEGAL_LINKS: FooterLink[] = [
  { key: "footer.legal.impressum", hrefDe: "/impressum", hrefEn: "/en/legal-notice" },
  { key: "footer.legal.datenschutz", hrefDe: "/datenschutz", hrefEn: "/en/privacy" },
  { key: "footer.legal.agb", hrefDe: "/agb", hrefEn: "/en/terms" },
];

const ADMIN_LINK = { href: "/admin/login", label: "Admin" };

function cleanBusinessName(name: string): string {
  return name.replace(/\s*\(Dev\)\s*$/i, "").trim();
}

export function Footer({ settings }: FooterProps) {
  const { t, locale } = useUiStrings();
  const hrefFor = (item: FooterLink) => (locale === "de" ? item.hrefDe : item.hrefEn);
  const displayName = cleanBusinessName(settings.business_name);
  const year = new Date().getFullYear();
  const rightsReserved = pickT(
    t,
    "footer.rights_reserved",
    locale === "de" ? "Alle Rechte vorbehalten." : "All rights reserved.",
  );

  return (
    <footer className="border-t-2 border-[var(--color-accent-secondary)] bg-[var(--color-bg-footer)] text-[var(--color-text-footer)]">
      <div>
        <Container as="div" className="py-9 md:py-10">
          <div className="grid gap-8 md:grid-cols-12 md:gap-6 lg:gap-10">
            <div className="self-start md:col-span-4 lg:col-span-5">
              <div className="inline-flex border border-[color:rgba(194,166,117,0.28)] bg-[var(--color-bg-footer-surface)] px-4 py-3">
                <Logo height={42} tone="light" />
              </div>
              <p className="mt-5 max-w-md text-[14px] leading-relaxed text-[var(--color-text-footer-muted)]">
                {t("footer.col.brand")}
              </p>
              <span className="sr-only">{displayName}</span>
            </div>

            <div className="md:col-span-2">
              <LinkColumn
                heading={t("footer.col.quick_links")}
                items={QUICK_LINKS}
                hrefFor={hrefFor}
                t={t}
                dark
              />
            </div>

            <div className="md:col-span-3">
              <LinkColumn
                heading={t("footer.col.services")}
                items={SERVICE_LINKS}
                hrefFor={hrefFor}
                t={t}
                dark
              />
            </div>

            <div className="md:col-span-3 lg:col-span-2">
              <ContactColumn heading={t("footer.col.contact")} settings={settings} dark />
            </div>
          </div>
          </Container>

          <div className="border-t border-[var(--color-border-footer)]">
            <Container
              as="div"
              className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between"
            >
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] tracking-[0.04em] text-[color:rgba(200,197,190,0.82)]">
                <span>
                  © {year} {displayName}. {rightsReserved}
                </span>
                <span aria-hidden="true" className="text-[var(--color-border-footer)]">
                  ·
                </span>
                <Link
                  href={ADMIN_LINK.href}
                  className="transition-colors duration-base hover:text-[var(--color-text-footer)]"
                >
                  {ADMIN_LINK.label}
                </Link>
              </p>

              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {LEGAL_LINKS.map((item) => (
                  <li key={item.key}>
                    <Link
                      href={hrefFor(item)}
                      className="text-[11px] tracking-[0.04em] text-[color:rgba(200,197,190,0.86)] transition-colors duration-base hover:text-[var(--color-accent-secondary)]"
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                ))}
                <li>
                  <ConsentSettingsButton className="text-[11px] tracking-[0.04em] text-[color:rgba(200,197,190,0.86)] transition-colors duration-base hover:text-[var(--color-accent-secondary)]" />
                </li>
              </ul>

              <LanguageSwitcher className="text-[var(--color-text-footer-muted)]" />
            </Container>
          </div>
        </div>
      </footer>
  );
}

interface LinkColumnProps {
  heading: string;
  items: FooterLink[];
  hrefFor: (item: FooterLink) => string;
  t: ReturnType<typeof useUiStrings>["t"];
  dark?: boolean;
}

function LinkColumn({ heading, items, hrefFor, t, dark = false }: LinkColumnProps) {
  return (
    <div>
      <p
        className={cn(
          "text-[10px] font-semibold uppercase tracking-[0.18em]",
          dark ? "text-[var(--color-accent-secondary)]" : "text-[var(--color-accent-primary)]",
        )}
      >
        {heading}
      </p>
      <span
        className={cn(
          "mt-2 block h-px w-8",
          dark ? "bg-[var(--color-border-footer)]" : "bg-[var(--color-border-soft)]",
        )}
        aria-hidden="true"
      />
      <ul className="mt-4 space-y-2.5">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={hrefFor(item)}
              className={cn(
                "text-[14px] transition-colors duration-base",
                dark
                  ? "text-[var(--color-text-footer-muted)] hover:text-[var(--color-text-footer)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
              )}
            >
              {t(item.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface ContactColumnProps {
  heading: string;
  settings: SettingsPublic;
  dark?: boolean;
}

function ContactColumn({ heading, settings, dark = false }: ContactColumnProps) {
  return (
    <div>
      <p
        className={cn(
          "text-[10px] font-semibold uppercase tracking-[0.18em]",
          dark ? "text-[var(--color-accent-secondary)]" : "text-[var(--color-accent-primary)]",
        )}
      >
        {heading}
      </p>
      <span
        className={cn(
          "mt-2 block h-px w-8",
          dark ? "bg-[var(--color-border-footer)]" : "bg-[var(--color-border-soft)]",
        )}
        aria-hidden="true"
      />
      <address
        className={cn(
          "mt-4 space-y-2.5 text-[14px] not-italic leading-relaxed",
          dark ? "text-[var(--color-text-footer-muted)]" : "text-[var(--color-text-secondary)]",
        )}
      >
        <p>{settings.address_street}</p>
        <p>
          {settings.address_postcode} {settings.address_city}
        </p>
        <p className="pt-1">
          <a
            href={toTelHref(settings.phone)}
            className={cn(
              "tabular-nums transition-colors duration-base",
              dark
                ? "hover:text-[var(--color-text-footer)]"
                : "hover:text-[var(--color-text-primary)]",
            )}
          >
            {settings.phone}
          </a>
        </p>
        {settings.whatsapp_url && (
          <p>
            <a
              href={settings.whatsapp_url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-1.5 transition-colors duration-base",
                dark
                  ? "hover:text-[var(--color-text-footer)]"
                  : "hover:text-[var(--color-text-primary)]",
              )}
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </a>
          </p>
        )}
        <p>
          <a
            href={`mailto:${settings.email}`}
            className={cn(
              "transition-colors duration-base",
              dark
                ? "hover:text-[var(--color-text-footer)]"
                : "hover:text-[var(--color-text-primary)]",
            )}
          >
            {settings.email}
          </a>
        </p>
      </address>
    </div>
  );
}
