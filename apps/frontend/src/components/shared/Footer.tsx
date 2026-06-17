"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Phone } from "lucide-react";
import { useUiStrings } from "@/hooks/useUiStrings";
import { Container } from "./Container";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Logo } from "./Logo";
import { WhatsAppIcon } from "./WhatsAppIcon";
import type { SettingsPublic } from "@/types";
import { toTelHref } from "@/utils/formatters";
import { pickT } from "@/lib/i18n/pick";
import { cn } from "@/utils/cn";

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

const NO_CTA_PREFIXES = [
  "/kontakt",
  "/buchen",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/en/contact",
  "/en/book",
  "/en/legal-notice",
  "/en/privacy",
  "/en/terms",
  "/admin",
];

function shouldShowCta(pathname: string | null): boolean {
  if (!pathname) return false;
  return !NO_CTA_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function cleanBusinessName(name: string): string {
  return name.replace(/\s*\(Dev\)\s*$/i, "").trim();
}

export function Footer({ settings }: FooterProps) {
  const { t, locale } = useUiStrings();
  const pathname = usePathname();
  const showCta = shouldShowCta(pathname);
  const hrefFor = (item: FooterLink) => (locale === "de" ? item.hrefDe : item.hrefEn);
  const displayName = cleanBusinessName(settings.business_name);
  const bookHref = locale === "de" ? "/buchen" : "/en/book";
  const year = new Date().getFullYear();
  const rightsReserved = pickT(
    t,
    "footer.rights_reserved",
    locale === "de" ? "Alle Rechte vorbehalten." : "All rights reserved.",
  );

  return (
    <footer className="bg-[var(--color-bg-footer)] text-[var(--color-text-footer)]">
      <div className="border-t border-[var(--color-border-footer)]">
        {showCta && (
          <Container as="div" className="py-10 md:py-12">
            <section className="border border-[var(--color-border-footer)] bg-[var(--color-bg-footer-surface)]">
              <div className="flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10 lg:p-10">
                <div className="max-w-2xl">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-secondary)]">
                    {pickT(
                      t,
                      "footer.cta.eyebrow",
                      locale === "de" ? "Direkt erreichbar" : "Directly reachable",
                    )}
                  </p>
                  <h2 className="mt-3 max-w-xl font-serif text-[30px] leading-[1.08] tracking-tight md:text-[36px]">
                    {pickT(
                      t,
                      "footer.cta.heading",
                      locale === "de"
                        ? "Bereit fuer Ihre naechste Fahrt?"
                        : "Ready for your next ride?",
                    )}
                  </h2>
                  <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-[var(--color-text-footer-muted)]">
                    {pickT(
                      t,
                      "footer.cta.sub",
                      locale === "de"
                        ? "Buchen Sie online oder sprechen Sie direkt mit uns. Klare Antworten, feste Planung und eine schnelle Rueckmeldung innerhalb unserer Telefonzeiten."
                        : "Book online or speak with us directly. Clear answers, structured planning, and a fast reply during phone hours.",
                    )}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:items-center lg:justify-end">
                  <Link
                    href={bookHref}
                    className={cn(
                      "group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-none border px-5 text-[12px] font-medium uppercase tracking-[0.16em]",
                      "border-[color:var(--color-bg-strong)] bg-[var(--color-bg-strong)] text-[var(--color-text-on-strong)] shadow-[0_2px_8px_rgba(15,17,21,0.08)]",
                      "ease-out-premium transition-all duration-base hover:border-[color:var(--color-bg-strong-hover)] hover:shadow-[0_6px_16px_rgba(15,17,21,0.12)] active:translate-y-px active:shadow-[0_2px_8px_rgba(15,17,21,0.08)]",
                      "before:ease-out-premium before:absolute before:inset-0 before:origin-left before:scale-x-0 before:bg-[var(--color-bg-strong-hover)] before:transition-transform before:duration-base hover:before:scale-x-100",
                    )}
                  >
                    <span className="relative z-10">
                      {pickT(t, "footer.cta.book", locale === "de" ? "Jetzt buchen" : "Book now")}
                    </span>
                    <ArrowRight
                      className="ease-out-premium relative z-10 h-3.5 w-3.5 transition-transform duration-base group-hover:translate-x-0.5"
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                  </Link>
                  <a
                    href={toTelHref(settings.phone)}
                    className="inline-flex h-12 items-center justify-center gap-2 border border-[var(--color-border-footer)] bg-transparent px-5 text-[12px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-footer)] transition-colors duration-base hover:border-[var(--color-accent-secondary)] hover:text-[var(--color-accent-secondary)]"
                  >
                    <Phone className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden="true" />
                    <span className="normal-case tabular-nums tracking-[0.04em]">
                      {settings.phone}
                    </span>
                  </a>
                </div>
              </div>
            </section>
          </Container>
        )}

        <div className={cn(showCta && "border-t border-[var(--color-border-footer)]")}>
          <Container as="div" className="py-12 md:py-14">
            <div className="grid gap-8 md:grid-cols-12 md:gap-6 lg:gap-10">
              <div className="md:col-span-4 lg:col-span-5">
                <div className="inline-flex border border-[var(--color-border-footer)] bg-[var(--color-bg-footer-surface)] px-4 py-3">
                  <Logo height={42} tone="light" />
                </div>
                <p className="mt-5 max-w-md text-[14px] leading-relaxed text-[var(--color-text-footer-muted)]">
                  {t("footer.col.brand")}
                </p>
                {settings.concession_number && (
                  <p className="mt-5 inline-flex items-center border-t border-[var(--color-border-footer)] pt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-secondary)]">
                    § 49 PBefG · {settings.concession_number}
                  </p>
                )}
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
              </ul>

              <LanguageSwitcher className="text-[var(--color-text-footer-muted)]" />
            </Container>
          </div>
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
