// src/components/shared/Header.tsx
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
 * The DB value has "(Dev)" appended to distinguish dev/prod databases;
 * end users should never see it. Production data will have a clean value.
 */
function cleanBusinessName(name: string): string {
  return name.replace(/\s*\(Dev\)\s*$/i, "").trim();
}

export function Header({ settings }: HeaderProps) {
  const { t, locale } = useUiStrings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const bookingHref = locale === "de" ? "/buchen" : "/en/book";

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const displayName = cleanBusinessName(settings.business_name);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-cream/95 backdrop-blur transition-all duration-base ease-out-premium",
        scrolled ? "border-b border-line shadow-sm" : "border-b border-transparent",
      )}
    >
      <Container as="div" className="flex h-[4.5rem] items-center justify-between gap-8 md:h-[5rem]">
        {/* Wordmark */}
        <Link
        href={locale === "de" ? "/" : "/en"}
        aria-label={displayName}
        className="flex items-center transition-opacity duration-base hover:opacity-80"
      >
        <Logo height={36} priority />
      </Link>

        {/* Primary nav */}
        <nav aria-label="Primary" className="hidden lg:flex lg:items-center lg:gap-9">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={locale === "de" ? item.hrefDe : item.hrefEn}
              className="text-[13px] text-ink/75 transition-colors duration-base hover:text-ink"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        {/* Right cluster — phone + language + CTA */}
        <div className="hidden items-center gap-6 lg:flex">
          <a
            href={toTelHref(settings.phone)}
            className="inline-flex items-center gap-2 text-[13px] text-ink/75 transition-colors duration-base hover:text-ink"
            aria-label={t("contact.method.phone")}
          >
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-medium tracking-tight">{settings.phone}</span>
          </a>
          <LanguageSwitcher />
          <Link href={bookingHref}>
            <Button size="sm" variant="secondary">
              {t("nav.book_now")}
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={t("nav.menu")}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="text-ink lg:hidden"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </Container>

      {/* Mobile menu */}
      <div
        className={cn(
          "border-t border-line bg-cream lg:hidden",
          mobileOpen ? "block" : "hidden",
        )}
      >
        <Container as="div" className="flex flex-col gap-5 py-8">
          <nav aria-label="Mobile" className="flex flex-col gap-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={locale === "de" ? item.hrefDe : item.hrefEn}
                onClick={() => setMobileOpen(false)}
                className="font-serif text-xl text-ink"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-4 border-t border-line pt-6">
            <a
              href={toTelHref(settings.phone)}
              className="flex items-center gap-2 text-base text-ink"
            >
              <Phone className="h-4 w-4 text-gold-dark" aria-hidden="true" />
              <span className="font-medium tracking-tight">{settings.phone}</span>
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
