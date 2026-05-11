// apps/frontend/src/components/shared/EmptyState.tsx
// Phase 3d polish — refined editorial empty-state for "no pricing yet",
// "no map coordinates", etc. Hairline frame + gold eyebrow optional.

import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface EmptyStateProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  eyebrow,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border border-line bg-paper p-10 text-center md:p-14",
        className,
      )}
    >
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
          {eyebrow}
        </p>
      )}
      <h3 className="mt-3 font-serif text-2xl tracking-tight text-ink md:text-3xl">
        {title}
      </h3>
      {description && (
        <p className="mx-auto mt-4 max-w-md text-[14.5px] leading-relaxed text-mute">
          {description}
        </p>
      )}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
