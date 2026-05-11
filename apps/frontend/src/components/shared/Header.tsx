// src/components/shared/Header.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useUiStrings } from "@/hooks/useUiStrings";
import { Container } from "./Container";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { PhoneCTA } from "./PhoneCTA";
import { Button } from "@/components/ui";
import type { SettingsPublic } from "@/types";
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

export function Header({ settings }: HeaderProps) {
  const { t, locale } = useUiStrings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const bookingHref = locale === "de" ? "/buchen" : "/en/book";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/95 backdrop-blur">
      <Container as="div" className="flex h-16 items-center justify-between gap-6 md:h-20">
        <Link href={locale === "de" ? "/" : "/en"} className="font-serif text-xl tracking-tight">
          {settings.business_name}
        </Link>

        <nav aria-label="Primary" className="hidden md:flex md:items-center md:gap-6">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={locale === "de" ? item.hrefDe : item.hrefEn}
              className="text-sm text-ink/80 transition-colors duration-base hover:text-ink"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <PhoneCTA phone={settings.phone} className="text-sm" />
          <LanguageSwitcher />
          <Link href={bookingHref}>
            <Button size="sm">{t("nav.book_now")}</Button>
          </Link>
        </div>

        <button
          type="button"
          aria-label={t("nav.menu")}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
          className="md:hidden"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </Container>

      {/* Mobile menu */}
      <div
        className={cn(
          "border-t border-line bg-cream md:hidden",
          mobileOpen ? "block" : "hidden",
        )}
      >
        <Container as="div" className="flex flex-col gap-4 py-6">
          <nav aria-label="Mobile" className="flex flex-col gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={locale === "de" ? item.hrefDe : item.hrefEn}
                onClick={() => setMobileOpen(false)}
                className="text-base text-ink"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-3 border-t border-line pt-4">
            <PhoneCTA phone={settings.phone} variant="stacked" label={t("contact.method.phone")} />
            <LanguageSwitcher />
            <Link href={bookingHref} onClick={() => setMobileOpen(false)}>
              <Button fullWidth>{t("nav.book_now")}</Button>
            </Link>
          </div>
        </Container>
      </div>
    </header>
  );
}
