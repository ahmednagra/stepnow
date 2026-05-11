// apps/frontend/src/components/features/home/TestimonialsSection.tsx
// Phase 3d polish — addresses audit H-6 and §11.2.
// Switches from 3-card grid to a single, large rotating editorial quote in
// Cormorant Garamond / serif at 32-40px. Reads as premium × 3 (per audit
// §11.2). Automatic rotation every 7s, pauses on hover, respects reduced motion.
// Falls back gracefully to a single static quote when only one testimonial.

"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useUiStrings } from "@/hooks/useUiStrings";
import type { TestimonialPublic } from "@/types";
import { Container } from "@/components/shared";
import { cn } from "@/utils/cn";

interface TestimonialsSectionProps {
  testimonials: TestimonialPublic[];
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const { t } = useUiStrings();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  // Hooks must be called unconditionally — bail-out lives below.
  const items = testimonials.slice(0, 6);

  // Restart auto-rotation only when count or pause changes.
  useEffect(() => {
    if (items.length <= 1 || paused) return;
    if (typeof window === "undefined") return;
    const prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, [items.length, paused]);

  if (items.length === 0) return null;
  const current = items[idx];

  return (
    <section className="border-t border-line bg-cream">
      <Container className="py-section">
        <header className="mb-12 max-w-3xl">
          <p className="label-eyebrow">
            {t("home.testimonials.pre_heading") || "Kundenstimmen"}
          </p>
          <h2 className="mt-3 font-serif text-section">{t("home.testimonials.heading")}</h2>
        </header>

        <figure
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="mx-auto max-w-4xl"
        >
          {/* Decorative gold open-quote — large, low-opacity. */}
          <span
            aria-hidden="true"
            className="block font-serif text-[6rem] leading-none text-gold/30 md:text-[8rem]"
          >
            “
          </span>
          {current.rating !== null && current.rating > 0 && (
            <RatingStars value={current.rating} />
          )}
          <blockquote
            key={current.id}
            className="mt-4 font-serif text-2xl leading-relaxed text-ink animate-fade-in md:text-3xl md:leading-[1.35]"
          >
            {current.quote}
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-3 text-[13px] uppercase tracking-[0.18em] text-mute">
            <span className="block h-px w-8 bg-gold" aria-hidden="true" />
            <span className="font-medium text-ink">{current.author_name}</span>
            {current.author_role && (
              <>
                <span className="text-line" aria-hidden="true">
                  ·
                </span>
                <span>{current.author_role}</span>
              </>
            )}
          </figcaption>
        </figure>

        {items.length > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show testimonial ${i + 1}`}
                onClick={() => setIdx(i)}
                className={cn(
                  "h-px w-10 transition-colors duration-base",
                  i === idx ? "bg-ink" : "bg-line hover:bg-mute",
                )}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

function RatingStars({ value }: { value: number }) {
  const max = 5;
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${value} of ${max} stars`}
    >
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          strokeWidth={1.25}
          className={cn(
            "h-4 w-4",
            i < value ? "fill-gold text-gold" : "text-line-strong",
          )}
        />
      ))}
    </div>
  );
}
