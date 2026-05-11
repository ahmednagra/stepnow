// apps/frontend/src/components/admin/KpiTile.tsx
// Phase 3d polish — refined KPI tile with hairline accent + tabular-nums value.

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface KpiTileProps {
  label: string;
  value: ReactNode;
  context?: string;
  icon?: ReactNode;
  className?: string;
}

export function KpiTile({ label, value, context, icon, className }: KpiTileProps) {
  return (
    <div
      className={cn(
        "border border-slate-200 bg-white p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>
        {icon && (
          <span className="text-slate-400" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 font-sans text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
        {value}
      </p>
      {context && (
        <p className="mt-1 text-[12px] text-slate-500">{context}</p>
      )}
    </div>
  );
}
