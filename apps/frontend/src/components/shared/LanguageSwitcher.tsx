// apps/frontend/src/components/shared/LanguageSwitcher.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUiStrings } from "@/hooks/useUiStrings";
import { getAlternateUrl } from "@/lib/i18n/routes";
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
  const { locale } = useUiStrings();
  const pathname = usePathname() ?? "/";
  const storeSlugMap = useSlugMap();

  const isEn = locale === "en";

  // Resolution order: explicit prop > store > static ROUTE_MAP > fallback.
  // Merging keeps an explicit prop's keys winning over the store's keys.
  const effectiveSlugMap = { ...storeSlugMap, ...(dynamicSlugMap ?? {}) };
  const alt = getAlternateUrl(
    pathname,
    Object.keys(effectiveSlugMap).length > 0 ? effectiveSlugMap : undefined,
  );

  const deHref = isEn ? alt : pathname;
  const enHref = isEn ? pathname : alt;

  // Active state: thin gold underline with generous offset so it doesn't
  // crowd the small-caps glyphs. Works on both light and dark surfaces.
  const activeStyles =
    "text-current underline decoration-gold decoration-[1.5px] underline-offset-[6px]";
  const inactiveStyles = "text-current/55 hover:text-current";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.20em]",
        className,
      )}
    >
      <Link
        href={deHref}
        onClick={() => persistLocaleCookie("de")}
        aria-current={!isEn ? "true" : undefined}
        className={cn(
          "transition-colors duration-base",
          !isEn ? activeStyles : inactiveStyles,
        )}
      >
        DE
      </Link>
      <span aria-hidden="true" className="text-current/30">
        /
      </span>
      <Link
        href={enHref}
        onClick={() => persistLocaleCookie("en")}
        aria-current={isEn ? "true" : undefined}
        className={cn(
          "transition-colors duration-base",
          isEn ? activeStyles : inactiveStyles,
        )}
      >
        EN
      </Link>
    </div>
  );
}