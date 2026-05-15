// apps/frontend/src/components/admin/AdminPageHeader.tsx
// Editorial page header: gold eyebrow + serif title + lede + action slot.

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
  variant?: "default" | "compact";
}

export function AdminPageHeader({
  title, description, eyebrow, actions, className, variant = "default",
}: AdminPageHeaderProps) {
  if (variant === "compact") {
    return (
      <header className={cn(
        "flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3.5",
        className,
      )}>
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-0.5 text-[9.5px] font-semibold uppercase tracking-[0.20em] text-[#A8865A]">{eyebrow}</p>
          )}
          <h1 className="font-sans text-[16px] font-semibold tracking-tight text-slate-900">{title}</h1>
          {description && <p className="mt-0.5 truncate text-[12px] text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
    );
  }
  return (
    <header className={cn(
      "flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5",
      className,
    )}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A8865A]">{eyebrow}</p>
        )}
        <h1 className="font-serif text-[26px] font-medium leading-none tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
