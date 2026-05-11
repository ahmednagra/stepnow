// apps/frontend/src/components/ui/Card.tsx
// New shared primitive (audit §11.1 — replaces ad-hoc `border border-line bg-cream p-6`).
// Use Card for any framed content surface that should feel premium and
// consistent across the public site (service tiles, vehicle cards, pricing
// boxes, contact-method blocks, testimonial frames).

"use client";

import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/utils/cn";

export type CardTone = "cream" | "paper" | "ink";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  padding?: CardPadding;
  /** Adds the premium card-hover treatment (ring + lift). Default false. */
  hoverable?: boolean;
  /** Render as <article> instead of <div> when used in lists. */
  as?: "div" | "article" | "li" | "section";
  children?: ReactNode;
}

const TONES: Record<CardTone, string> = {
  cream: "bg-cream border-line text-ink",
  paper: "bg-paper border-line-soft text-ink",
  ink: "bg-ink border-cream/15 text-cream",
};
const PADDINGS: Record<CardPadding, string> = {
  none: "",
  sm: "p-5",
  md: "p-7",
  lg: "p-9",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    tone = "cream",
    padding = "md",
    hoverable = false,
    as: Tag = "div",
    className,
    children,
    ...rest
  },
  ref,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TagAny = Tag as any;
  return (
    <TagAny
      ref={ref}
      className={cn(
        "border",
        TONES[tone],
        PADDINGS[padding],
        hoverable && "card-hover",
        className,
      )}
      {...rest}
    >
      {children}
    </TagAny>
  );
});
