// apps/frontend/src/components/admin/AdminCard.tsx
// Phase 3d polish — refined admin card with subtle shadow + header divider.

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface AdminCardProps {
  title?: ReactNode;
  description?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  /** When true, no body padding so embedded tables flush against the frame. */
  flush?: boolean;
  className?: string;
  children: ReactNode;
}

export function AdminCard({
  title,
  description,
  headerActions,
  footer,
  flush = false,
  className,
  children,
}: AdminCardProps) {
  return (
    <section
      className={cn(
        "border border-slate-200 bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      {(title || description || headerActions) && (
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3.5">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[13px] font-semibold tracking-tight text-slate-900">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-[12px] text-slate-500">{description}</p>
            )}
          </div>
          {headerActions && <div className="shrink-0">{headerActions}</div>}
        </header>
      )}
      <div className={cn(flush ? "" : "p-5")}>{children}</div>
      {footer && (
        <footer className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-[12px] text-slate-500">
          {footer}
        </footer>
      )}
    </section>
  );
}
