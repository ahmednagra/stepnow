// src/components/features/services/ServiceDetailHeader.tsx
import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, ServicePublic, SettingsPublic } from "@/types";
import { Container } from "@/components/shared";
import { Button } from "@/components/ui";
import { toTelHref } from "@/utils/formatters";

interface ServiceDetailHeaderProps {
  service: ServicePublic;
  settings: SettingsPublic;
  bookingHref: string;
  t: TFunction;
  locale: Locale;
}

export function ServiceDetailHeader({
  service,
  settings,
  bookingHref,
  t,
  locale,
}: ServiceDetailHeaderProps) {
  const callLabel = locale === "de" ? "Anrufen" : "Call us";

  return (
    <section className="bg-ink text-cream">
      <Container className="grid items-center gap-10 py-section md:grid-cols-2 md:py-24">
        <div className="flex flex-col gap-5">
          <p className="label-eyebrow !text-gold">{t("services.page.title")}</p>
          <h1 className="font-serif text-section md:text-hero">{service.title}</h1>
          <p className="max-w-prose text-body-lg text-cream/80">{service.short_description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <Link href={bookingHref}>
              <Button size="lg">{t("services.card.book")}</Button>
            </Link>
            <a href={toTelHref(settings.phone)}>
              <Button
                size="lg"
                variant="outline"
                leadingIcon={<Phone className="h-4 w-4" aria-hidden="true" />}
                className="border-cream text-cream hover:bg-cream hover:text-ink"
              >
                {callLabel}
              </Button>
            </a>
          </div>
        </div>
        <ServiceHeroImage url={service.hero_image_url} alt={service.title} />
      </Container>
    </section>
  );
}

function ServiceHeroImage({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div
        className="flex aspect-[5/4] items-center justify-center border border-cream/10"
        aria-hidden="true"
      >
        <span className="px-8 text-center font-serif text-4xl leading-tight text-cream/15 md:text-5xl">
          {alt}
        </span>
      </div>
    );
  }
  return (
    <div className="relative aspect-[5/4] overflow-hidden">
      <Image
        src={url}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
        priority
      />
    </div>
  );
}
