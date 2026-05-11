// src/components/shared/Container.tsx
import { type HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  as?: "div" | "section" | "header" | "footer" | "main" | "article" | "nav";
  size?: "default" | "prose";
}

export function Container({
  as: Tag = "div",
  size = "default",
  className,
  children,
  ...rest
}: ContainerProps) {
  return (
    <Tag
      className={cn(size === "prose" ? "prose-base" : "container-base", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}
