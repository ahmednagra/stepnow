// apps/frontend/src/components/features/services/ServiceListItem.tsx
// Phase 3d polish — alternating two-column layout. Atmospheric block on one
// side (image or typographic dark fallback), serif title + short description
// + first paragraph excerpt + "Read more" link on the other.

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { ServicePublic } from "@/types";
import { Container } from "@/components/shared";
import { cn } from "@/utils/cn";
import { resolveMediaUrl } from "@/utils/media-url";

interface ServiceListItemProps {
  t: TFunction;
  service: ServicePublic;
  detailHref: string;
  index: number;
}

function firstParagraph(md: string | null | undefined): string | null {
  if (!md) return null;
  // Strip markdown noise and take the first paragraph (up to ~280 chars).
  const stripped = md
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`]/g, "")
    .trim();
  const para = stripped.split(/\n{2,}/)[0]?.trim();
  if (!para) return null;
  return para.length > 280 ? `${para.slice(0, 280).trim()}…` : para;
}

export function ServiceListItem({ t, service, detailHref, index }: ServiceListItemProps) {
  const isOdd = index % 2 === 1;
  const excerpt = firstParagraph(service.long_description);

  return (
    <article className="border-b border-line">
      <Container className="grid gap-12 py-section md:grid-cols-12 md:gap-12">
        {/* Visual block */}
        <div
          className={cn(
            "md:col-span-5",
            isOdd && "md:order-2",
          )}
        >
          {service.hero_image_url ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-line-soft">
              <Image
                src={resolveMediaUrl(service.hero_image_url)}
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
                className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,134,90,0.22),transparent_60%)]"
              />
              <p className="relative font-serif text-3xl tracking-tight md:text-4xl">
                {service.title}
              </p>
            </div>
          )}
        </div>

        {/* Text */}
        <div className={cn("flex flex-col gap-5 md:col-span-7 md:justify-center", isOdd && "md:order-1")}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
            {String(index + 1).padStart(2, "0")} · {t("services.page.title")}
          </p>
          <h2 className="font-serif text-display-md tracking-tight md:text-[3.5rem]">
            {service.title}
          </h2>
          <p className="max-w-xl text-body-lg text-mute">{service.short_description}</p>
          {excerpt && (
            <p className="max-w-prose text-[15px] leading-relaxed text-mute">{excerpt}</p>
          )}
          <Link
            href={detailHref}
            className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.20em] text-gold-deep transition-colors duration-base hover:text-ink"
          >
            {t("services.card.learn_more")}
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform duration-base ease-out-premium group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </Container>
    </article>
  );
}
