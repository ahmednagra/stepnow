// src/components/features/services/ServiceListItem.tsx
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { ServicePublic } from "@/types";
import { Container } from "@/components/shared";
import { Button } from "@/components/ui";
import { cn } from "@/utils/cn";

interface ServiceListItemProps {
  service: ServicePublic;
  detailHref: string;
  /** Alternate left/right per index. */
  index: number;
  t: TFunction;
}

export function ServiceListItem({ service, detailHref, index, t }: ServiceListItemProps) {
  const imageOnLeft = index % 2 === 0;

  return (
    <article className="border-b border-line last:border-b-0">
      <Container className="py-section">
        <div
          className={cn(
            "grid gap-10 md:grid-cols-2 md:items-center",
            !imageOnLeft && "md:[&>*:first-child]:order-2",
          )}
        >
          <ServiceImage url={service.hero_image_url} alt={service.title} />
          <div className="flex flex-col gap-5">
            <p className="label-eyebrow">{`0${index + 1}`.slice(-2)}</p>
            <h2 className="font-serif text-section">{service.title}</h2>
            <p className="text-body-lg text-mute">{service.short_description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <Link href={detailHref}>
                <Button size="md" trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
                  {t("services.card.learn_more")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </article>
  );
}

function ServiceImage({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className="flex aspect-[5/4] items-center justify-center bg-ink/95" aria-hidden="true">
        <span className="px-6 text-center font-serif text-3xl text-cream/25 md:text-4xl">
          {alt}
        </span>
      </div>
    );
  }
  return (
    <div className="relative aspect-[5/4] overflow-hidden bg-line/30">
      <Image src={url} alt={alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
    </div>
  );
}
