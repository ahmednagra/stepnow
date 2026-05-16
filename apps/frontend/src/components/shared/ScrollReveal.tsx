// apps/frontend/src/components/shared/ScrollReveal.tsx
// Scroll-triggered fade-up. Now short-circuits when prefers-reduced-motion is set — skips IntersectionObserver entirely, sets visible immediately, saves observer instances on slow devices (M-6).

"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface ScrollRevealProps {
children: ReactNode;
delay?: number;
immediate?: boolean;
stagger?: boolean;
className?: string;
as?: "div" | "section" | "article" | "li" | "header" | "ul" | "ol";
}

export function ScrollReveal({
children,
delay = 0,
immediate = false,
stagger = false,
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
if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduced) {
setVisible(true);
return;
}
}
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
<TagAny
ref={setRef}
className={cn(stagger ? "stagger" : "reveal", visible && "is-visible", className)}
>
{children}
</TagAny>
);
}
