// apps/frontend/src/components/admin/dashboard/RangeSwitcher.tsx
// Local segmented control used by dashboard cards.

"use client";

import { memo } from "react";
import { cn } from "@/utils/cn";

export type Range = "7d" | "30d" | "90d" | "ytd";
const OPTIONS: { value: Range; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "ytd", label: "YTD" },
];

interface Props { value: Range; onChange: (v: Range) => void; }

function RangeSwitcherBase({ value, onChange }: Props) {
  return (
    <div role="tablist" className="flex border border-slate-200">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            "px-3 py-1 text-[11px] font-medium tabular-nums tracking-wide transition-colors",
            o.value === value
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const RangeSwitcher = memo(RangeSwitcherBase);
