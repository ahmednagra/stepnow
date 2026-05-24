// apps/frontend/src/components/features/services/ServiceDetailHeader.tsx
// Phase 3d polish — refined service hero with eyebrow, large serif title,
// service icon as a small gold-bordered glyph, and an atmospheric image
// block on the right side when hero_image_url is set. When the image is
// absent, the right column becomes a typographic block on dark ink.

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import type { TFunction } from "@/lib/i18n/t";
import type { ServicePublic } from "@/types";
import { Container } from "@/components/shared";
import { Button } from "@/components/ui";
import { pickT } from "@/lib/i18n/pick";
import { getServiceHeroImage } from "@/components/features/pricing/PricingSections";

interface ServiceDetailHeaderProps {
  t: TFunction;
  service: ServicePublic;
  bookingPath: string;
}

export function ServiceDetailHeader({ t, service, bookingPath }: ServiceDetailHeaderProps) {
  const heroUrl = getServiceHeroImage(service.slug, service.hero_image_url);

  return (
    <section className="bg-[var(--color-bg-page)]">
      <Container className="py-section">
        <div className="grid gap-8 lg:grid-cols-[0.98fr_1.02fr] lg:gap-10">
          <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-6 md:p-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
              {t("services.page.title")}
            </p>
            <h2 className="mt-2 font-serif text-[32px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[38px]">
              {service.title}
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
              {service.short_description}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href={`${bookingPath}?service=${service.slug}`}>
                <Button
                  size="lg"
                  trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                >
                  {pickT(t, "services.detail.cta_book", "Diesen Service buchen")}
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden border border-[color:var(--color-border-soft)] bg-[var(--color-text-primary)]">
            <Image
              src={heroUrl}
              alt={service.title}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(47,58,31,0.08),rgba(47,58,31,0.44))]" />
          </div>
        </div>
      </Container>
    </section>
  );
}
