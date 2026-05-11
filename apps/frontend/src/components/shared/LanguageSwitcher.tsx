// apps/frontend/src/components/shared/LanguageSwitcher.tsx
// Phase 3d polish — refined: tighter divider, tabular-nums, hover gold-deep.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUiStrings } from "@/hooks/useUiStrings";
import { getAlternateUrl } from "@/lib/i18n/routes";
import { cn } from "@/utils/cn";

interface LanguageSwitcherProps {
  className?: string;
  /** Override alt path for dynamic routes (e.g. service detail). */
  dynamicSlugMap?: Record<string, string>;
}

export function LanguageSwitcher({ className, dynamicSlugMap }: LanguageSwitcherProps) {
  const { locale } = useUiStrings();
  const pathname = usePathname() ?? "/";

  const isEn = locale === "en";
  const alt = getAlternateUrl(pathname, dynamicSlugMap);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.20em]",
        className,
      )}
    >
      <Link
        href={isEn ? alt : pathname}
        aria-current={!isEn ? "true" : undefined}
        className={cn(
          "transition-colors duration-base",
          !isEn ? "text-current" : "text-current/55 hover:text-current",
        )}
      >
        DE
      </Link>
      <span aria-hidden="true" className="text-current/30">
        /
      </span>
      <Link
        href={isEn ? pathname : alt}
        aria-current={isEn ? "true" : undefined}
        className={cn(
          "transition-colors duration-base",
          isEn ? "text-current" : "text-current/55 hover:text-current",
        )}
      >
        EN
      </Link>
    </div>
  );
}
