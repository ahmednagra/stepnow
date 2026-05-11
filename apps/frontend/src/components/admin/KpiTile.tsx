// src/components/admin/KpiTile.tsx
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

interface KpiTileProps {
  label: string;
  value: string | number;
  /** Subtle context line, e.g. "Last 7 days". */
  context?: string;
  /** Make the tile a link to a detail page. */
  href?: string;
  /** Optional icon (lucide). */
  icon?: ReactNode;
}

export function KpiTile({ label, value, context, href, icon }: KpiTileProps) {
  const inner = (
    <div className="group flex flex-col gap-1 border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>
      <div className="flex items-center justify-between">
        {context ? (
          <p className="text-[11px] text-slate-500">{context}</p>
        ) : (
          <span />
        )}
        {href && (
          <ArrowUpRight
            className="h-3 w-3 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}
