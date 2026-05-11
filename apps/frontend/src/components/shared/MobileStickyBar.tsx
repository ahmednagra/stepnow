// apps/frontend/src/components/shared/MobileStickyBar.tsx
// New component — addresses audit H-2 (sticky mobile call/book bar).
// Appears at the bottom of mobile viewports only (< lg), respecting safe-area
// inset. Shows after the user scrolls past the hero so it doesn't compete
// with the visible CTA on the first screen.

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, ArrowRight } from "lucide-react";
import { useUiStrings } from "@/hooks/useUiStrings";
import type { SettingsPublic } from "@/types";
import { toTelHref } from "@/utils/formatters";
import { cn } from "@/utils/cn";

interface MobileStickyBarProps {
  settings: SettingsPublic;
  /** Pixels of scroll before the bar reveals. Default 600. */
  revealAfter?: number;
}

export function MobileStickyBar({ settings, revealAfter = 600 }: MobileStickyBarProps) {
  const { t, locale } = useUiStrings();
  const [visible, setVisible] = useState(false);
  const bookingHref = locale === "de" ? "/buchen" : "/en/book";

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > revealAfter);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [revealAfter]);

  return (
    <div
      role="region"
      aria-label={t("nav.book_now")}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 backdrop-blur lg:hidden",
        "transition-all duration-base ease-out-premium",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-full opacity-0",
      )}
    >
      <div className="grid grid-cols-2 gap-px bg-line pb-safe">
        <a
          href={toTelHref(settings.phone)}
          className="flex items-center justify-center gap-2 bg-cream py-4 text-[14px] font-medium tracking-tight text-ink"
          aria-label={`${t("contact.method.phone")}: ${settings.phone}`}
        >
          <Phone className="h-4 w-4 text-gold-deep" aria-hidden="true" strokeWidth={1.5} />
          <span>{t("common.call_us")}</span>
        </a>
        <Link
          href={bookingHref}
          className="flex items-center justify-center gap-2 bg-ink py-4 text-[14px] font-medium tracking-tight text-cream"
        >
          <span>{t("nav.book_now")}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
