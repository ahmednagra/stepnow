"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, MapPin, Menu, Phone, X } from "lucide-react";
import { useUiStrings } from "@/hooks/useUiStrings";
import { Logo } from "./Logo";
import { Container } from "./Container";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { WhatsAppIcon } from "./WhatsAppIcon";
import type { SettingsPublic } from "@/types";
import { toTelHref } from "@/utils/formatters";
import { cn } from "@/utils/cn";

interface HeaderProps {
  settings: SettingsPublic;
}

interface NavItem {
  key: string;
  hrefDe: string;
  hrefEn: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "nav.home", hrefDe: "/", hrefEn: "/en" },
  { key: "nav.services", hrefDe: "/dienstleistungen", hrefEn: "/en/services" },
  { key: "nav.pricing", hrefDe: "/preise", hrefEn: "/en/pricing" },
  { key: "nav.about", hrefDe: "/ueber-uns", hrefEn: "/en/about" },
  { key: "footer.legal.impressum", hrefDe: "/impressum", hrefEn: "/en/legal-notice" },
  { key: "nav.contact", hrefDe: "/kontakt", hrefEn: "/en/contact" },
];

function cleanBusinessName(name: string): string {
  return name.replace(/\s*\(Dev\)\s*$/i, "").trim();
}

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/en") return pathname === "/en";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({ settings }: HeaderProps) {
  const { t, locale } = useUiStrings();
  const pathname = usePathname() ?? (locale === "de" ? "/" : "/en");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const displayName = cleanBusinessName(settings.business_name);
  const homeHref = locale === "de" ? "/" : "/en";
  const bookingHref = locale === "de" ? "/buchen" : "/en/book";
  const navItems = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        href: locale === "de" ? item.hrefDe : item.hrefEn,
      })),
    [locale],
  );

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <div className="hidden border-b border-[color:var(--color-border-soft)] lg:block">
        <Container
          as="div"
          className="flex h-10 items-center justify-between text-[11px] font-medium tracking-[0.05em] text-[var(--color-text-secondary)]"
        >
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-2">
              <MapPin
                className="h-3.5 w-3.5 text-[var(--color-accent-primary)]"
                strokeWidth={1.6}
                aria-hidden="true"
              />
              <span>{settings.address_city}</span>
            </span>
            <a
              href={toTelHref(settings.phone)}
              className="inline-flex items-center gap-2 transition-colors duration-base hover:text-[var(--color-text-primary)]"
            >
              <Phone
                className="h-3.5 w-3.5 text-[var(--color-accent-primary)]"
                strokeWidth={1.6}
                aria-hidden="true"
              />
              <span className="tabular-nums">{settings.phone}</span>
            </a>
            {settings.whatsapp_url && (
              <a
                href={settings.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 transition-colors duration-base hover:text-[var(--color-text-primary)]"
              >
                <WhatsAppIcon className="h-3.5 w-3.5 text-[var(--color-accent-primary)]" />
                <span>WhatsApp</span>
              </a>
            )}
          </div>
          <LanguageSwitcher className="text-[var(--color-text-secondary)]" />
        </Container>
      </div>

      <header
        className={cn(
          "ease-out-premium sticky top-0 z-40 transition-all duration-base",
          "bg-[color:rgba(247,244,234,0.92)] backdrop-blur",
          scrolled
            ? "border-b border-[color:var(--color-border-soft)] shadow-[0_4px_14px_rgba(15,17,21,0.06)]"
            : "border-b border-transparent",
        )}
      >
        <Container
          as="div"
          className="flex h-[4.5rem] items-center justify-between gap-5 lg:h-[4rem]"
        >
          <Link
            href={homeHref}
            aria-label={displayName}
            className="flex shrink-0 items-center transition-opacity duration-base hover:opacity-85"
          >
            <Logo height={48} priority />
          </Link>

          <nav
            aria-label="Primary"
            className="hidden lg:flex lg:items-center lg:justify-center lg:gap-8"
          >
            {navItems.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={cn(
                    "relative py-2 text-[14px] font-semibold tracking-[0.02em] transition-colors duration-base",
                    active
                      ? "text-[var(--color-text-primary)]"
                      : "text-[color:rgba(15,17,21,0.72)] hover:text-[var(--color-text-primary)]",
                  )}
                >
                  {t(item.key)}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "ease-out-premium absolute inset-x-0 -bottom-[10px] h-px origin-left transition-transform duration-base",
                      "bg-[var(--color-accent-primary)]",
                      active ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href={bookingHref}
              className={cn(
                "group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-none border px-5 text-[12px] font-medium uppercase tracking-[0.16em]",
                "border-[color:var(--color-bg-strong)] bg-[var(--color-bg-strong)] text-[var(--color-text-on-strong)] shadow-[0_2px_8px_rgba(15,17,21,0.08)]",
                "ease-out-premium transition-all duration-base hover:border-[color:var(--color-bg-strong-hover)] hover:shadow-[0_6px_16px_rgba(15,17,21,0.12)] active:translate-y-px active:shadow-[0_2px_8px_rgba(15,17,21,0.08)]",
                "before:ease-out-premium before:absolute before:inset-0 before:origin-left before:scale-x-0 before:bg-[var(--color-bg-strong-hover)] before:transition-transform before:duration-base hover:before:scale-x-100",
              )}
            >
              <span className="relative z-10">{t("nav.book_now")}</span>
              <ChevronRight
                className="ease-out-premium relative z-10 h-3.5 w-3.5 transition-transform duration-base group-hover:translate-x-0.5"
                strokeWidth={1.7}
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {settings.whatsapp_url && (
              <a
                href={settings.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className={cn(
                  "inline-flex h-10 w-10 items-center justify-center border transition-colors duration-base",
                  "border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]",
                  "hover:border-[color:var(--color-accent-primary)] hover:text-[var(--color-accent-primary)]",
                )}
              >
                <WhatsAppIcon className="h-[18px] w-[18px]" />
              </a>
            )}
            <a
              href={toTelHref(settings.phone)}
              aria-label={`${t("contact.method.phone")}: ${settings.phone}`}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center border transition-colors duration-base",
                "border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]",
                "hover:border-[color:var(--color-accent-primary)] hover:text-[var(--color-accent-primary)]",
              )}
            >
              <Phone className="h-[18px] w-[18px]" aria-hidden="true" strokeWidth={1.7} />
            </a>
            <button
              type="button"
              aria-label={mobileOpen ? t("nav.close") : t("nav.menu")}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((value) => !value)}
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center border transition-colors duration-base",
                "border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]",
                "hover:border-[color:var(--color-accent-primary)] hover:text-[var(--color-accent-primary)]",
              )}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" aria-hidden="true" strokeWidth={1.7} />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" strokeWidth={1.7} />
              )}
            </button>
          </div>
        </Container>

        <div
          className={cn(
            "border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] lg:hidden",
            mobileOpen ? "block" : "hidden",
          )}
        >
          <Container as="div" className="flex flex-col gap-6 py-6">
            <div className="rounded-[6px] border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-primary)]">
                    {displayName}
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                    {settings.address_street}
                    <br />
                    {settings.address_postcode} {settings.address_city}
                  </p>
                </div>
                <LanguageSwitcher className="text-[var(--color-text-secondary)]" />
              </div>
              <a
                href={toTelHref(settings.phone)}
                className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-[var(--color-text-primary)]"
              >
                <Phone
                  className="h-4 w-4 text-[var(--color-accent-primary)]"
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
                <span className="tabular-nums">{settings.phone}</span>
              </a>
            </div>

            <nav
              aria-label="Mobile"
              className="flex flex-col border-y border-[color:var(--color-border-soft)]"
            >
              {navItems.map((item) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between border-b border-[color:var(--color-border-soft)] py-4 text-[17px] tracking-tight last:border-b-0",
                      active
                        ? "font-medium text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-secondary)]",
                    )}
                  >
                    <span>{t(item.key)}</span>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4",
                        active
                          ? "text-[var(--color-accent-primary)]"
                          : "text-[var(--color-text-secondary)]",
                      )}
                      strokeWidth={1.7}
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </nav>

            <Link
              href={bookingHref}
              className={cn(
                "group relative inline-flex h-12 items-center justify-center gap-2 overflow-hidden rounded-none border px-5 text-[12px] font-medium uppercase tracking-[0.16em]",
                "border-[color:var(--color-bg-strong)] bg-[var(--color-bg-strong)] text-[var(--color-text-on-strong)] shadow-[0_2px_8px_rgba(15,17,21,0.08)]",
                "ease-out-premium transition-all duration-base hover:border-[color:var(--color-bg-strong-hover)] hover:shadow-[0_6px_16px_rgba(15,17,21,0.12)] active:translate-y-px active:shadow-[0_2px_8px_rgba(15,17,21,0.08)]",
                "before:ease-out-premium before:absolute before:inset-0 before:origin-left before:scale-x-0 before:bg-[var(--color-bg-strong-hover)] before:transition-transform before:duration-base hover:before:scale-x-100",
              )}
            >
              <span className="relative z-10">{t("nav.book_now")}</span>
              <ChevronRight
                className="ease-out-premium relative z-10 h-3.5 w-3.5 transition-transform duration-base group-hover:translate-x-0.5"
                strokeWidth={1.7}
                aria-hidden="true"
              />
            </Link>
          </Container>
        </div>
      </header>
    </>
  );
}
