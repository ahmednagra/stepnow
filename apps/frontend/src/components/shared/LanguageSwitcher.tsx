// src/components/shared/LanguageSwitcher.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useUiStrings } from "@/hooks/useUiStrings";
import { LOCALE_COOKIE_MAX_AGE_SECONDS, LOCALE_COOKIE_NAME } from "@/lib/i18n/config";
import { getAlternateUrl } from "@/lib/i18n/routes";
import type { Locale } from "@/types";
import { cn } from "@/utils/cn";

interface LanguageSwitcherProps {
  /** Optional override for dynamic routes (e.g. service detail with slug pairs). */
  dynamicSlugMap?: Record<string, string>;
  className?: string;
}

export function LanguageSwitcher({ dynamicSlugMap, className }: LanguageSwitcherProps) {
  const { t, locale } = useUiStrings();
  const pathname = usePathname() || "/";
  const router = useRouter();

  function setLocale(target: Locale) {
    if (target === locale) return;
    // Persist preference
    document.cookie =
      `${LOCALE_COOKIE_NAME}=${target}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
    const dest = getAlternateUrl(pathname, dynamicSlugMap);
    router.push(dest);
  }

  return (
    <div
      role="group"
      aria-label={t("language.switch.current")}
      className={cn("inline-flex items-center gap-2 text-sm", className)}
    >
      <button
        type="button"
        onClick={() => setLocale("de")}
        aria-current={locale === "de" ? "true" : undefined}
        className={cn(
          "px-1 py-0.5 transition-colors duration-base",
          locale === "de"
            ? "font-semibold text-ink underline underline-offset-4"
            : "text-mute hover:text-ink",
        )}
      >
        DE
      </button>
      <span aria-hidden="true" className="text-line">/</span>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-current={locale === "en" ? "true" : undefined}
        className={cn(
          "px-1 py-0.5 transition-colors duration-base",
          locale === "en"
            ? "font-semibold text-ink underline underline-offset-4"
            : "text-mute hover:text-ink",
        )}
      >
        EN
      </button>
    </div>
  );
}
