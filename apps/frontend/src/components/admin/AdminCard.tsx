// src/components/admin/AdminCard.tsx
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface AdminCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  /** Slot for header-right actions (e.g. Save button). */
  headerActions?: ReactNode;
  className?: string;
  /** Remove inner padding (e.g. when child is a full-bleed table). */
  flush?: boolean;
}

export function AdminCard({
  title,
  description,
  children,
  headerActions,
  className,
  flush = false,
}: AdminCardProps) {
  return (
    <section className={cn("border border-slate-200 bg-white", className)}>
      {(title || headerActions) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[13px] font-semibold tracking-tight text-slate-900">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
            )}
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </header>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}
