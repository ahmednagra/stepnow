// apps/frontend/src/components/shared/Container.tsx
// Phase 3d polish — kept thin; uses the .container-base utility from globals.css.

import { type ElementType, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  /** Render as this tag. Default 'section'. */
  as?: ElementType;
  children: ReactNode;
}

export function Container({
  as: Tag = "section",
  className,
  children,
  ...rest
}: ContainerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TagAny = Tag as any;
  return (
    <TagAny className={cn("container-base", className)} {...rest}>
      {children}
    </TagAny>
  );
}
