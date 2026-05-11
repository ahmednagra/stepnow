// src/components/shared/Breadcrumb.tsx
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { buildBreadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";
import { cn } from "@/utils/cn";

export interface BreadcrumbCrumb {
  name: string;
  href: string;
}

interface BreadcrumbProps {
  crumbs: BreadcrumbCrumb[];
  className?: string;
}

/**
 * Visible breadcrumb trail + matching BreadcrumbList JSON-LD.
 * The current page is the last crumb and rendered as text (no link).
 */
export function Breadcrumb({ crumbs, className }: BreadcrumbProps) {
  if (crumbs.length === 0) return null;

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className={cn("flex items-center text-sm text-mute", className)}
      >
        <ol className="flex flex-wrap items-center gap-1.5">
          {crumbs.map((crumb, idx) => {
            const isLast = idx === crumbs.length - 1;
            return (
              <li key={crumb.href} className="flex items-center gap-1.5">
                {idx > 0 && (
                  <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 text-line" />
                )}
                {isLast ? (
                  <span aria-current="page" className="text-ink">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="transition-colors duration-base hover:text-ink"
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <JsonLd data={buildBreadcrumbJsonLd(crumbs)} />
    </>
  );
}
