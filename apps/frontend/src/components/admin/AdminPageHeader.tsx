// apps/frontend/src/components/admin/AdminPageHeader.tsx
// Phase 3d polish — refined admin page header: tighter title, optional
// description, right-aligned action slot.

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="font-sans text-[17px] font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 truncate text-[12px] text-slate-500">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
