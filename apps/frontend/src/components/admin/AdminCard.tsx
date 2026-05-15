// apps/frontend/src/components/admin/AdminCard.tsx
// Card surface with optional gold eyebrow + serif H2 + actions.

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface AdminCardProps {
  title?: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  headerActions?: ReactNode;
  footer?: ReactNode;
  flush?: boolean;
  serif?: boolean;
  className?: string;
  children: ReactNode;
}

export function AdminCard({
  title, description, eyebrow, headerActions, footer, flush = false, serif = false, className, children,
}: AdminCardProps) {
  return (
    <section className={cn(
      "border border-slate-200 bg-white shadow-[0_1px_2px_0_rgba(15,23,42,0.03)]",
      className,
    )}>
      {(title || description || headerActions || eyebrow) && (
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3.5">
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-0.5 text-[9.5px] font-semibold uppercase tracking-[0.20em] text-[#A8865A]">{eyebrow}</p>
            )}
            {title && (
              <h2 className={cn(
                "text-slate-900",
                serif
                  ? "font-serif text-[17px] font-medium leading-tight tracking-tight"
                  : "text-[13px] font-semibold tracking-tight",
              )}>
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-[12px] text-slate-500">{description}</p>}
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
