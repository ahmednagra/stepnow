// apps/frontend/src/components/shared/LanguageSwitcher.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUiStrings } from "@/hooks/useUiStrings";
import { getMirrorUrl } from "@/lib/i18n/routes";
import {
  LOCALE_COOKIE_NAME,
  LOCALE_COOKIE_MAX_AGE_SECONDS,
} from "@/lib/i18n/config";
import { useSlugMap } from "@/stores/useLocaleAlternatesStore";
import type { Locale } from "@/types";
import { cn } from "@/utils/cn";

interface LanguageSwitcherProps {
  className?: string;
  /**
   * Per-page DE↔EN slug map. When supplied, takes precedence over both
   * the global store (useLocaleAlternatesStore) and the static ROUTE_MAP.
   * Most callers should NOT pass this — use <SlugMapBridge> from the
   * page instead, so the slug map is centralized in the store.
   */
  dynamicSlugMap?: Record<string, string>;
}

/**
 * Write the locale cookie from the browser. Mirrors the cookie attributes
 * the middleware sets, so the middleware reads what we wrote on the next
 * request.
 */
function persistLocaleCookie(locale: Locale): void {
  if (typeof document === "undefined") return;
  const parts = [
    `${LOCALE_COOKIE_NAME}=${locale}`,
    `Path=/`,
    `Max-Age=${LOCALE_COOKIE_MAX_AGE_SECONDS}`,
    `SameSite=Lax`,
  ];
  if (window.location.protocol === "https:") parts.push("Secure");
  document.cookie = parts.join("; ");
}

export function LanguageSwitcher({ className, dynamicSlugMap }: LanguageSwitcherProps) {
  const { locale, t } = useUiStrings();
  const pathname = usePathname() ?? "/";
  const storeSlugMap = useSlugMap();

  // Resolution order: explicit prop > store > static ROUTE_MAP. Merging keeps an
  // explicit prop's keys winning over the store's keys. null = this page has no
  // counterpart in the other locale (e.g. the staff-only order form), so that
  // language is shown but not linked — never a link to a 404.
  const effectiveSlugMap = { ...storeSlugMap, ...(dynamicSlugMap ?? {}) };
  const mirror = getMirrorUrl(
    pathname,
    Object.keys(effectiveSlugMap).length > 0 ? effectiveSlugMap : undefined,
  );

  // Active state: thin accent underline with generous offset so it doesn't
  // crowd the small-caps glyphs. Works on both light and dark surfaces.
  const activeStyles =
    "text-current underline decoration-[var(--color-accent-primary)] decoration-[1.5px] underline-offset-[6px]";
  const inactiveStyles = "text-current/55 hover:text-current";

  function option(target: Locale, label: string) {
    const isActive = target === locale;
    const href = isActive ? pathname : mirror;
    const name = t(target === "de" ? "language.switch.de" : "language.switch.en");
    if (href === null) {
      return (
        <span aria-disabled="true" title={name} className="cursor-not-allowed text-current/30">
          {label}
        </span>
      );
    }
    return (
      <Link
        href={href}
        hrefLang={target}
        aria-label={name}
        onClick={() => persistLocaleCookie(target)}
        aria-current={isActive ? "true" : undefined}
        className={cn("transition-colors duration-base", isActive ? activeStyles : inactiveStyles)}
      >
        {label}
      </Link>
    );
  }

  return (
    <div
      role="group"
      aria-label={t("language.switch.current")}
      className={cn(
        "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.20em]",
        className,
      )}
    >
      {option("de", "DE")}
      <span aria-hidden="true" className="text-current/30">
        /
      </span>
      {option("en", "EN")}
    </div>
  );
}
