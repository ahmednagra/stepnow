// apps/frontend/src/components/shared/Footer.tsx
// Site footer with two layouts depending on the current route:
//
//   • Marketing pages (home, about, services, service-detail, pricing) →
//     LEFT block = Brand + Quick Links + Services
//     RIGHT block = "Ready to ride?" CTA (replaces the Contact column)
//
//   • Conversion / legal pages (contact, booking, impressum, datenschutz, agb) →
//     Standard four-column layout (Brand · Quick Links · Services · Contact),
//     no CTA. Sales pitch is inappropriate next to legal disclosures.
//
// The dark region's height is roughly the same in both states — the CTA fills
// exactly the space the Contact column would occupy.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Phone } from "lucide-react";
import { useUiStrings } from "@/hooks/useUiStrings";
import { Container } from "./Container";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { SettingsPublic } from "@/types";
import { toTelHref } from "@/utils/formatters";
import { pickT } from "@/lib/i18n/pick";
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
  { key: "services.flughafentransfer", hrefDe: "/dienstleistungen/flughafentransfer", hrefEn: "/en/services/airport-transfer" },
  { key: "services.krankenhausfahrten", hrefDe: "/dienstleistungen/krankenhausfahrten", hrefEn: "/en/services/hospital-transport" },
  { key: "services.schuelerbefoerderung", hrefDe: "/dienstleistungen/schuelerbefoerderung", hrefEn: "/en/services/school-transport" },
  { key: "services.shuttle", hrefDe: "/dienstleistungen/shuttle-service", hrefEn: "/en/services/shuttle-service" },
];

const LEGAL_LINKS: FooterLink[] = [
  { key: "footer.legal.impressum", hrefDe: "/impressum", hrefEn: "/en/legal-notice" },
  { key: "footer.legal.datenschutz", hrefDe: "/datenschutz", hrefEn: "/en/privacy" },
  { key: "footer.legal.agb", hrefDe: "/agb", hrefEn: "/en/terms" },
];

const ADMIN_LINK = { href: "/admin/login", label: "Admin" };

/** Pages where the footer should NOT include the "Ready to ride?" CTA.
 *  Anything not in this list gets the CTA — covers /, /en, /ueber-uns,
 *  /dienstleistungen[/...], /preise, /en/about, /en/services[/...], /en/pricing.
 */
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
  return !NO_CTA_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
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

  return (
    <footer className="bg-ink text-cream">
      <Container as="div" className={showCta ? "py-14 md:py-16" : "py-12 md:py-14"}>
        {showCta ? (
          /* ───── Two-block layout: info (7) + CTA (5) ───── */
          <div className="grid gap-10 md:grid-cols-12 md:gap-14">
            {/* LEFT: Brand + Quick Links + Services */}
            <div className="md:col-span-7">
              <div className="grid gap-10 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-5">
                  <BrandBlock t={t} settings={settings} displayName={displayName} />
                </div>
                <div className="md:col-span-7">
                  <div className="grid grid-cols-2 gap-8">
                    <LinkColumn
                      heading={t("footer.col.quick_links")}
                      items={QUICK_LINKS}
                      hrefFor={hrefFor}
                      t={t}
                    />
                    <LinkColumn
                      heading={t("footer.col.services")}
                      items={SERVICE_LINKS}
                      hrefFor={hrefFor}
                      t={t}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: CTA */}
            <div className="md:col-span-5 md:border-l md:border-cream/10 md:pl-10 lg:pl-14">
              <div className="flex h-full flex-col justify-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
                  {pickT(
                    t,
                    "footer.cta.eyebrow",
                    locale === "de" ? "Bereit, mit uns zu fahren?" : "Ready when you are",
                  )}
                </p>
                <h2 className="mt-2 font-serif text-[26px] leading-[1.1] tracking-tight text-cream md:text-[30px]">
                  {pickT(
                    t,
                    "footer.cta.heading",
                    locale === "de" ? "Bereit für Ihre Fahrt?" : "Ready to ride with us?",
                  )}
                </h2>
                <p className="mt-3 max-w-md text-[13.5px] leading-relaxed text-cream/65">
                  {pickT(
                    t,
                    "footer.cta.sub",
                    locale === "de"
                      ? "Buchen Sie online oder rufen Sie an — wir melden uns innerhalb von 30 Minuten."
                      : "Book online or call — we reply within 30 minutes during phone hours.",
                  )}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Link
                    href={bookHref}
                    className="inline-flex items-center gap-2 bg-cream px-5 py-3 text-[12.5px] font-medium tracking-tight text-ink transition-colors duration-base hover:bg-white"
                  >
                    {pickT(t, "footer.cta.book", locale === "de" ? "Jetzt buchen" : "Book now")}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  </Link>
                  <a
                    href={toTelHref(settings.phone)}
                    className="inline-flex items-center gap-2 border border-cream/40 px-5 py-3 text-[12.5px] font-medium tabular-nums tracking-tight text-cream transition-colors duration-base hover:bg-cream/5"
                  >
                    <Phone className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                    <span>{settings.phone}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ───── Standard 4-column layout (no CTA) ───── */
          <div className="grid gap-10 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-4">
              <BrandBlock t={t} settings={settings} displayName={displayName} />
            </div>
            <div className="md:col-span-2">
              <LinkColumn
                heading={t("footer.col.quick_links")}
                items={QUICK_LINKS}
                hrefFor={hrefFor}
                t={t}
              />
            </div>
            <div className="md:col-span-3">
              <LinkColumn
                heading={t("footer.col.services")}
                items={SERVICE_LINKS}
                hrefFor={hrefFor}
                t={t}
              />
            </div>
            <div className="md:col-span-3">
              <ContactColumn heading={t("footer.col.contact")} settings={settings} />
            </div>
          </div>
        )}
      </Container>

      {/* Bottom strip — identical in both states */}
      <div className="border-t border-cream/10">
        <Container
          as="div"
          className="flex flex-col items-start justify-between gap-4 py-5 md:flex-row md:items-center"
        >
          <p className="flex items-center gap-3 text-[11px] tracking-wide text-cream/45">
            <span>
              © {new Date().getFullYear()} {displayName}. {t("footer.copyright")}
            </span>
            <span aria-hidden="true" className="text-cream/20">
              ·
            </span>
            <Link
              href={ADMIN_LINK.href}
              className="text-cream/40 transition-colors duration-base hover:text-cream/70"
            >
              {ADMIN_LINK.label}
            </Link>
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

/* ─────────── Helpers ─────────── */

interface BrandBlockProps {
  t: ReturnType<typeof useUiStrings>["t"];
  settings: SettingsPublic;
  displayName: string;
}
function BrandBlock({ t, settings, displayName }: BrandBlockProps) {
  return (
    <>
      <div className="inline-flex items-center bg-cream px-4 py-3">
        <Logo height={40} />
      </div>
      <p className="mt-5 max-w-xs text-[13.5px] leading-relaxed text-cream/60">
        {t("footer.col.brand")}
      </p>
      {settings.concession_number && (
        <p className="mt-4 inline-block border-t border-gold/30 pt-3 text-[11px] uppercase tracking-[0.22em] text-gold">
          § 49 PBefG · {settings.concession_number}
        </p>
      )}
      {/* displayName is referenced for SR-only context if needed in future */}
      <span className="sr-only">{displayName}</span>
    </>
  );
}

interface LinkColumnProps {
  heading: string;
  items: FooterLink[];
  hrefFor: (item: FooterLink) => string;
  t: ReturnType<typeof useUiStrings>["t"];
}
function LinkColumn({ heading, items, hrefFor, t }: LinkColumnProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{heading}</p>
      <span className="mt-2 block h-px w-6 bg-gold/40" aria-hidden="true" />
      <ul className="mt-4 space-y-2">
        {items.map((item) => (
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
  );
}

interface ContactColumnProps {
  heading: string;
  settings: SettingsPublic;
}
function ContactColumn({ heading, settings }: ContactColumnProps) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{heading}</p>
      <span className="mt-2 block h-px w-6 bg-gold/40" aria-hidden="true" />
      <address className="mt-4 space-y-1 not-italic text-[13px] leading-relaxed text-cream/75">
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
  );
}
