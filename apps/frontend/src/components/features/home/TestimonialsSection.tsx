"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Quote, Star } from "lucide-react";
import { useUiStrings } from "@/hooks/useUiStrings";
import type { TestimonialPublic } from "@/types";
import { Container } from "@/components/shared";
import { cn } from "@/utils/cn";
import { pickT } from "@/lib/i18n/pick";

interface TestimonialsSectionProps {
  testimonials: TestimonialPublic[];
}

const SECTION_IMAGE =
  "/others/testimonial.avif";

const PORTRAIT_FALLBACKS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=600&q=80",
];

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  const { t } = useUiStrings();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const sectionRef = useRef<HTMLElement | null>(null);

  const items = testimonials.slice(0, 6);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) setInView(entry.isIntersecting);
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (items.length <= 1 || paused || !inView || !tabVisible) return;
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, [items.length, paused, inView, tabVisible]);

  if (items.length === 0) return null;
  const current = items[idx];

  return (
    <section
      ref={sectionRef}
      className="border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]"
    >
      <Container className="py-section">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
          <div className="grid gap-px border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)]">
            <div className="bg-[var(--color-bg-surface)] p-6 md:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
                {pickT(t, "home.testimonials.pre_heading", "Kundenstimmen")}
              </p>
              <h2 className="mt-3 max-w-lg font-serif text-section text-[var(--color-text-primary)] md:text-display-md">
                {t("home.testimonials.heading")}
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--color-text-secondary)] md:text-[16px]">
                {pickT(
                  t,
                  "home.testimonials.lead",
                  "Persoenliche Rueckmeldungen von Fahrgaesten, die Zuverlaessigkeit, Ruhe und direkte Abstimmung benoetigen.",
                )}
              </p>
            </div>

            <div className="relative min-h-[300px] bg-[var(--color-bg-surface)] md:min-h-[380px]">
              <Image
                src={SECTION_IMAGE}
                alt="Professional chauffeur service vehicle on the road"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(47,58,31,0.06),rgba(47,58,31,0.44))]" />
            </div>
          </div>

          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="grid gap-px border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)]"
          >
            <figure className="bg-[var(--color-bg-surface)] p-6 md:p-8">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
                    <Image
                      src={resolvePortrait(current, idx)}
                      alt={current.author_name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[16px] font-medium tracking-tight text-[var(--color-text-primary)]">
                      {current.author_name}
                    </p>
                    {current.author_role && (
                      <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                        {current.author_role}
                      </p>
                    )}
                  </div>
                </div>
                <span className="inline-flex h-12 w-12 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)]">
                  <Quote className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
                </span>
              </div>

              {current.rating !== null && current.rating > 0 && (
                <div className="mt-6">
                  <RatingStars value={current.rating} />
                </div>
              )}

              <blockquote
                key={current.id}
                className="mt-5 max-w-2xl font-serif text-[24px] leading-[1.45] text-[var(--color-text-primary)] animate-fade-in md:text-[30px]"
              >
                {current.quote}
              </blockquote>
            </figure>

            <div className="grid gap-px bg-[color:var(--color-border-soft)] sm:grid-cols-2">
              {items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Show testimonial ${i + 1}`}
                  onClick={() => setIdx(i)}
                  className={cn(
                    "flex items-center gap-4 bg-[var(--color-bg-surface)] p-4 text-left transition-colors duration-base",
                    items.length % 2 === 1 && i === items.length - 1 && "sm:col-span-2",
                    i === idx
                      ? "bg-[var(--color-bg-page)]"
                      : "hover:bg-[var(--color-bg-page)]",
                  )}
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
                    <Image
                      src={resolvePortrait(item, i)}
                      alt={item.author_name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium tracking-tight text-[var(--color-text-primary)]">
                      {item.author_name}
                    </p>
                    {item.author_role && (
                      <p className="mt-1 truncate text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                        {item.author_role}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function resolvePortrait(item: TestimonialPublic, index: number): string {
  const fromData = item.author_photo_url?.trim();
  if (fromData) return fromData;
  return PORTRAIT_FALLBACKS[index % PORTRAIT_FALLBACKS.length];
}

function RatingStars({ value }: { value: number }) {
  const max = 5;
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} of ${max} stars`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          strokeWidth={1.25}
          className={cn(
            "h-4 w-4",
            i < value
              ? "fill-[var(--color-accent-highlight)] text-[var(--color-accent-highlight)]"
              : "text-[color:var(--color-border-soft)]",
          )}
        />
      ))}
    </div>
  );
}
