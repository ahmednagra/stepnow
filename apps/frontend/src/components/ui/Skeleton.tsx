// src/components/ui/Skeleton.tsx
import { type HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Width as a Tailwind class or arbitrary CSS, defaults to full. */
  width?: string;
  /** Height as a Tailwind class or arbitrary CSS, defaults to 1rem. */
  height?: string;
}

export function Skeleton({ width, height, className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-none bg-line/60",
        width ?? "w-full",
        height ?? "h-4",
        className,
      )}
      {...rest}
    />
  );
}
