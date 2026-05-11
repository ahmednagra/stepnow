// src/components/features/home/TestimonialsSection.tsx
import { Star } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { TestimonialPublic } from "@/types";
import { Container } from "@/components/shared";
import { cn } from "@/utils/cn";

interface TestimonialsSectionProps {
  t: TFunction;
  testimonials: TestimonialPublic[];
}

export function TestimonialsSection({ t, testimonials }: TestimonialsSectionProps) {
  if (testimonials.length === 0) return null;
  // Show up to 3 on the homepage
  const items = testimonials.slice(0, 3);

  return (
    <section className="border-t border-line bg-cream">
      <Container className="py-section">
        <header className="mb-12 max-w-3xl">
          <h2 className="font-serif text-section">{t("home.testimonials.heading")}</h2>
        </header>
        <ul className="grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex flex-col gap-4 border border-line bg-cream p-6"
            >
              {it.rating !== null && it.rating > 0 && <RatingStars value={it.rating} />}
              <blockquote className="font-serif text-lg italic leading-relaxed text-ink">
                <span aria-hidden="true">„</span>
                {it.quote}
                <span aria-hidden="true">"</span>
              </blockquote>
              <footer className="mt-auto text-sm text-mute">
                <p className="font-medium text-ink">{it.author_name}</p>
                {it.author_role && <p>{it.author_role}</p>}
              </footer>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function RatingStars({ value }: { value: number }) {
  const max = 5;
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} von ${max} Sternen`}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn(
            "h-4 w-4",
            i < value ? "fill-gold text-gold" : "text-line",
          )}
        />
      ))}
    </div>
  );
}
