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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

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
      <Container className="py-10 md:py-12">
        <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8">
          <div className="grid gap-px border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)]">
            <div className="bg-[var(--color-bg-surface)] p-5 md:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
                {pickT(t, "home.testimonials.pre_heading", "Kundenstimmen")}
              </p>
              <h2 className="mt-1.5 font-serif text-[26px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[32px]">
                {t("home.testimonials.heading")}
              </h2>
              <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                {pickT(
                  t,
                  "home.testimonials.lead",
                  "Persönliche Rückmeldungen von Fahrgästen, die Zuverlässigkeit, Ruhe und direkte Abstimmung benötigen.",
                )}
              </p>
            </div>

            <div className="relative min-h-[180px] bg-[var(--color-bg-surface)] md:min-h-[220px]">
              <Image
                src={SECTION_IMAGE}
                alt="Professional chauffeur service vehicle on the road"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,17,21,0.06),rgba(15,17,21,0.44))]" />
            </div>
          </div>

          <div
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className="grid gap-px border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)]"
          >
            <figure className="bg-[var(--color-bg-surface)] p-5 md:p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex items-center gap-3">
                  <Avatar name={current.author_name} photoUrl={current.author_photo_url} size={48} />
                  <div>
                    <p className="text-[14.5px] font-medium tracking-tight text-[var(--color-text-primary)]">
                      {current.author_name}
                    </p>
                    {current.author_role && (
                      <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                        {current.author_role}
                      </p>
                    )}
                  </div>
                </div>
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-accent-primary)]">
                  <Quote className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
                </span>
              </div>

              {current.rating !== null && current.rating > 0 && (
                <div className="mt-4">
                  <RatingStars value={current.rating} />
                </div>
              )}

              <blockquote
                key={current.id}
                className="mt-3 max-w-2xl font-serif text-[19px] leading-[1.45] text-[var(--color-text-primary)] animate-fade-in md:text-[22px]"
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
                    "flex items-center gap-3 bg-[var(--color-bg-surface)] p-3 text-left transition-colors duration-base",
                    items.length % 2 === 1 && i === items.length - 1 && "sm:col-span-2",
                    i === idx
                      ? "bg-[var(--color-bg-page)]"
                      : "hover:bg-[var(--color-bg-page)]",
                  )}
                >
                  <Avatar name={item.author_name} photoUrl={item.author_photo_url} size={36} />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium tracking-tight text-[var(--color-text-primary)]">
                      {item.author_name}
                    </p>
                    {item.author_role && (
                      <p className="mt-0.5 truncate text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
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

function Avatar({ name, photoUrl, size }: { name: string; photoUrl: string | null; size: number }) {
  const src = photoUrl?.trim();
  return (
    <div
      className="relative shrink-0 overflow-hidden border border-[color:var(--color-border-soft)] bg-[var(--color-bg-accent-soft)]"
      style={{ height: size, width: size }}
    >
      {src ? (
        <Image src={src} alt={name} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center font-serif font-medium text-[var(--color-accent-primary)]"
          style={{ fontSize: size * 0.36 }}
          aria-hidden="true"
        >
          {initials(name)}
        </span>
      )}
    </div>
  );
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
