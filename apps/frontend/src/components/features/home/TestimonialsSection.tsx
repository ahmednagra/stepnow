"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { useUiStrings } from "@/hooks/useUiStrings";
import type { TestimonialPublic } from "@/types";
import { Container } from "@/components/shared";
import { cn } from "@/utils/cn";
import { pickT } from "@/lib/i18n/pick";

interface TestimonialsSectionProps {
  testimonials: TestimonialPublic[];
}

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
  const items = testimonials.slice(0, 3);
  if (items.length === 0) return null;

  return (
    <section className="border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
      <Container className="py-10 md:py-14">
        <header className="mb-7 flex flex-col items-start gap-4 md:mb-9 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
              {pickT(t, "home.testimonials.pre_heading", "Kundenstimmen")}
            </p>
            <h2 className="mt-2 font-serif text-[34px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[42px]">
              {t("home.testimonials.heading")}
            </h2>
            <span className="accent-rule mt-4" aria-hidden="true" />
          </div>
          <p className="max-w-sm text-[13.5px] leading-relaxed text-[var(--color-text-secondary)] md:text-right">
            {pickT(
              t,
              "home.testimonials.lead",
              "Persoenliche Rueckmeldungen von Fahrgaesten, die Zuverlaessigkeit, Ruhe und direkte Abstimmung benoetigen.",
            )}
          </p>
        </header>

        <ul className="grid gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <li
              key={item.id}
              className="card-elevated flex flex-col gap-4 border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-6"
            >
              {item.rating !== null && item.rating > 0 && <RatingStars value={item.rating} />}
              <blockquote className="font-serif text-[18px] leading-[1.5] text-[var(--color-text-primary)] md:text-[20px]">
                {item.quote}
              </blockquote>
              <figcaption className="mt-auto flex items-center gap-3 border-t border-[color:var(--color-border-soft)] pt-4">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
                  <Image
                    src={resolvePortrait(item, i)}
                    alt={item.author_name}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium tracking-tight text-[var(--color-text-primary)]">
                    {item.author_name}
                  </p>
                  {item.author_role && (
                    <p className="mt-0.5 truncate text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
                      {item.author_role}
                    </p>
                  )}
                </div>
              </figcaption>
            </li>
          ))}
        </ul>
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
