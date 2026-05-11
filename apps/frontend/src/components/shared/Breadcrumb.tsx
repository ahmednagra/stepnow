// apps/frontend/src/components/shared/Breadcrumb.tsx
// Phase 3d polish — refined: smaller, all-caps with wider tracking, gold
// last-crumb. Slash separators feel more editorial than chevrons.

import Link from "next/link";
import { Fragment } from "react";

export interface BreadcrumbCrumb {
  name: string;
  href: string;
}

interface BreadcrumbProps {
  crumbs: BreadcrumbCrumb[];
}

export function Breadcrumb({ crumbs }: BreadcrumbProps) {
  if (crumbs.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.22em]">
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <Fragment key={`${crumb.href}-${idx}`}>
              <li>
                {isLast ? (
                  <span aria-current="page" className="text-gold-deep">
                    {crumb.name}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-mute transition-colors duration-base hover:text-ink"
                  >
                    {crumb.name}
                  </Link>
                )}
              </li>
              {!isLast && (
                <li aria-hidden="true" className="text-line-strong">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
