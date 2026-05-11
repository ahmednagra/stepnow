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

interface ServiceDetailHeaderProps {
  t: TFunction;
  service: ServicePublic;
  bookingPath: string;
}

export function ServiceDetailHeader({ t, service, bookingPath }: ServiceDetailHeaderProps) {
  return (
    <section className="bg-cream">
      <Container className="pt-6 pb-section">
        <div className="grid gap-12 md:grid-cols-12 md:gap-10">
          <div className="flex flex-col gap-6 md:col-span-7">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="block h-px w-10 bg-gold" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
                {t("services.page.title")}
              </p>
            </div>
            <h1 className="font-serif text-section md:text-display-md lg:text-display-lg">
              {service.title}
            </h1>
            <p className="max-w-xl text-body-lg text-mute">{service.short_description}</p>
            <div className="mt-4">
              <Link href={`${bookingPath}?service=${service.slug}`}>
                <Button
                  size="lg"
                  trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
                >
                  {t("services.detail.cta_book") || "Diesen Service buchen"}
                </Button>
              </Link>
            </div>
          </div>

          {/* Atmospheric block — image OR typographic dark block */}
          <div className="md:col-span-5">
            {service.hero_image_url ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-line-soft">
                <Image
                  src={service.hero_image_url}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="relative flex aspect-[4/3] w-full items-end overflow-hidden bg-ink p-8 text-cream">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,134,90,0.20),transparent_60%)]"
                />
                <p className="relative font-serif text-3xl tracking-tight text-cream md:text-4xl">
                  {service.title}
                </p>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
