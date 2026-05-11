// apps/frontend/src/components/shared/Header.tsx
// Phase 3d polish — addresses audit F-2 (mobile phone CTA visible).
//   • Adds a one-tap call icon button in the right cluster on < lg viewports
//     so mobile users never need to open the drawer just to call.
//   • Refines hover (text-ink/75 → text-ink with subtle gold accent on CTA).
//   • Hides the wordmark on the smallest mobile widths so the call icon never
//     gets cramped.

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { useUiStrings } from "@/hooks/useUiStrings";
import { Logo } from "./Logo";
import { Container } from "./Container";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Button } from "@/components/ui";
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
  { key: "nav.contact", hrefDe: "/kontakt", hrefEn: "/en/contact" },
];

/**
 * Strip the seeded "(Dev)" suffix from the business name for display.
 */
function cleanBusinessName(name: string): string {
  return name.replace(/\s*\(Dev\)\s*$/i, "").trim();
}

export function Header({ settings }: HeaderProps) {
  const { t, locale } = useUiStrings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const bookingHref = locale === "de" ? "/buchen" : "/en/book";
  const displayName = cleanBusinessName(settings.business_name);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when the mobile drawer is open.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-cream/95 backdrop-blur transition-all duration-base ease-out-premium",
        scrolled
          ? "border-b border-line shadow-premium-sm"
          : "border-b border-transparent",
      )}
    >
      <Container
        as="div"
        className="flex h-[4.5rem] items-center justify-between gap-4 md:h-[5rem]"
      >
        {/* Wordmark */}
        <Link
          href={locale === "de" ? "/" : "/en"}
          aria-label={displayName}
          className="flex items-center transition-opacity duration-base hover:opacity-80"
        >
          <Logo height={36} priority />
        </Link>

        {/* Primary nav — desktop only */}
        <nav aria-label="Primary" className="hidden lg:flex lg:items-center lg:gap-9">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={locale === "de" ? item.hrefDe : item.hrefEn}
              className="text-[13px] font-medium tracking-tight text-ink/70 transition-colors duration-base hover:text-ink"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        {/* Right cluster — desktop */}
        <div className="hidden items-center gap-6 lg:flex">
          <a
            href={toTelHref(settings.phone)}
            className="inline-flex items-center gap-2 text-[13px] text-ink/75 transition-colors duration-base hover:text-ink"
            aria-label={t("contact.method.phone")}
          >
            <Phone className="h-3.5 w-3.5 text-gold-deep" aria-hidden="true" strokeWidth={1.5} />
            <span className="font-medium tracking-tight tabular-nums">{settings.phone}</span>
          </a>
          <LanguageSwitcher />
          <Link href={bookingHref}>
            <Button size="sm" variant="secondary">
              {t("nav.book_now")}
            </Button>
          </Link>
        </div>

        {/* Right cluster — mobile (Phone icon + drawer toggle) */}
        <div className="flex items-center gap-1 lg:hidden">
          <a
            href={toTelHref(settings.phone)}
            aria-label={`${t("contact.method.phone")}: ${settings.phone}`}
            className="inline-flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-gold-deep"
          >
            <Phone className="h-5 w-5" aria-hidden="true" strokeWidth={1.5} />
          </a>
          <button
            type="button"
            aria-label={mobileOpen ? t("nav.close") : t("nav.menu")}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center text-ink"
          >
            {mobileOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>
      </Container>

      {/* Mobile drawer */}
      <div
        className={cn(
          "border-t border-line bg-cream lg:hidden",
          mobileOpen ? "block" : "hidden",
        )}
      >
        <Container as="div" className="flex flex-col gap-6 py-8">
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={locale === "de" ? item.hrefDe : item.hrefEn}
                onClick={() => setMobileOpen(false)}
                className="border-b border-line-soft py-3 font-serif text-xl tracking-tight text-ink transition-colors hover:text-gold-deep"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-4 pt-2">
            <a
              href={toTelHref(settings.phone)}
              className="flex items-center gap-2 text-base text-ink"
            >
              <Phone className="h-4 w-4 text-gold-deep" aria-hidden="true" strokeWidth={1.5} />
              <span className="font-medium tracking-tight tabular-nums">{settings.phone}</span>
            </a>
            <LanguageSwitcher />
            <Link href={bookingHref} onClick={() => setMobileOpen(false)}>
              <Button fullWidth size="lg">
                {t("nav.book_now")}
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    </header>
  );
}
