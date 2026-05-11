// src/components/shared/ScrollReveal.tsx
"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface ScrollRevealProps {
  children: ReactNode;
  /** Delay in ms before the fade-up triggers once in view. Default 0. */
  delay?: number;
  /** Disable reveal — render plain. Useful for hero/above-fold content. */
  immediate?: boolean;
  className?: string;
  /** Render as this tag. */
  as?: "div" | "section" | "article" | "li" | "header";
}

/**
 * Restrained scroll-triggered fade-up. CSS-only animation; this component just
 * toggles the `.is-visible` class when the element enters the viewport.
 *
 * - IntersectionObserver, threshold 0.1, fires once then disconnects.
 * - Respects `prefers-reduced-motion` via the CSS in globals.css.
 * - Uses a callback ref so we can stay agnostic about Tag (div/section/...).
 */
export function ScrollReveal({
  children,
  delay = 0,
  immediate = false,
  className,
  as: Tag = "div",
}: ScrollRevealProps) {
  const [visible, setVisible] = useState(immediate);
  const [node, setNode] = useState<HTMLElement | null>(null);

  const setRef = useCallback((el: HTMLElement | null) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (immediate || visible || !node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            if (delay > 0) {
              setTimeout(() => setVisible(true), delay);
            } else {
              setVisible(true);
            }
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [delay, immediate, visible, node]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TagAny = Tag as any;
  return (
    <TagAny ref={setRef} className={cn("reveal", visible && "is-visible", className)}>
      {children}
    </TagAny>
  );
}
