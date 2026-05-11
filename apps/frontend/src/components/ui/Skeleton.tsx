// apps/frontend/src/components/ui/Skeleton.tsx
// Phase 3d polish — adds variants for service-card, vehicle-card, table-row,
// and admin-list skeleton patterns. Color uses line-soft for a calmer
// shimmer that doesn't read as "broken" (audit §12.8).

import { type HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type SkeletonVariant = "block" | "text" | "card-service" | "card-vehicle" | "row";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  variant?: SkeletonVariant;
}

export function Skeleton({
  width,
  height,
  variant = "block",
  className,
  ...rest
}: SkeletonProps) {
  if (variant === "card-service") {
    return (
      <div
        className={cn("border border-line bg-cream p-8 md:p-10", className)}
        aria-hidden="true"
      >
        <div className="h-7 w-3/5 animate-pulse bg-line-soft" />
        <div className="mt-4 h-4 w-full animate-pulse bg-line-soft" />
        <div className="mt-2 h-4 w-4/5 animate-pulse bg-line-soft" />
        <div className="mt-8 h-3 w-24 animate-pulse bg-line-soft" />
      </div>
    );
  }
  if (variant === "card-vehicle") {
    return (
      <div className={cn("border border-line bg-cream", className)} aria-hidden="true">
        <div className="aspect-[4/3] w-full animate-pulse bg-line-soft" />
        <div className="p-6">
          <div className="h-5 w-1/2 animate-pulse bg-line-soft" />
          <div className="mt-3 h-3 w-1/3 animate-pulse bg-line-soft" />
          <div className="mt-4 space-y-2">
            <div className="h-3 w-4/5 animate-pulse bg-line-soft" />
            <div className="h-3 w-2/3 animate-pulse bg-line-soft" />
          </div>
        </div>
      </div>
    );
  }
  if (variant === "row") {
    return (
      <div
        className={cn("flex h-12 items-center gap-3 border-b border-line px-4", className)}
        aria-hidden="true"
      >
        <div className="h-3 w-1/4 animate-pulse bg-line-soft" />
        <div className="h-3 w-1/4 animate-pulse bg-line-soft" />
        <div className="h-3 w-1/6 animate-pulse bg-line-soft" />
      </div>
    );
  }
  if (variant === "text") {
    return (
      <div
        aria-hidden="true"
        className={cn("animate-pulse bg-line-soft", width ?? "w-full", height ?? "h-3", className)}
        {...rest}
      />
    );
  }
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse bg-line-soft",
        width ?? "w-full",
        height ?? "h-4",
        className,
      )}
      {...rest}
    />
  );
}
