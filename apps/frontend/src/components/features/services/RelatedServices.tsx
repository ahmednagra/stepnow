// apps/frontend/src/components/features/services/RelatedServices.tsx
// Phase 3d polish — 3-up grid with the same hover treatment as the homepage
// services tiles. Hairline grid built with gap-px on a line-colored parent.

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { ServicePublic } from "@/types";
import { Container } from "@/components/shared";
import { pickT } from "@/lib/i18n/pick";

interface RelatedServicesProps {
  t: TFunction;
  services: ServicePublic[];
  hrefBase: string; // "/dienstleistungen" or "/en/services"
}

export function RelatedServices({ t, services, hrefBase }: RelatedServicesProps) {
  if (services.length === 0) return null;
  return (
    <section className="border-t border-line bg-cream">
      <Container className="py-section">
        <header className="mb-10 max-w-3xl">
          <p className="label-eyebrow">{pickT(t, "services.related.eyebrow", "Weitere Leistungen")}</p>
          <h2 className="mt-3 font-serif text-section">
            {pickT(t, "services.related.heading", "Weitere Leistungen")}
          </h2>
        </header>
        <ul className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
          {services.map((s) => (
            <li key={s.id} className="bg-cream">
              <Link
                href={`${hrefBase}/${s.slug}`}
                className="group flex h-full flex-col gap-3 p-7 transition-all duration-base ease-out-premium hover:shadow-ring-ink"
              >
                <h3 className="font-serif text-xl tracking-tight">{s.title}</h3>
                <p className="line-clamp-3 text-[14.5px] leading-relaxed text-mute">
                  {s.short_description}
                </p>
                <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[12px] font-semibold uppercase tracking-[0.18em] text-gold-deep transition-colors duration-base group-hover:text-ink">
                  {t("services.card.learn_more")}
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-base ease-out-premium group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
