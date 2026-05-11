// apps/frontend/src/app/(public)/dienstleistungen/[slug]/page.tsx
// Phase 3d polish — adds drop-cap to long_description first paragraph (audit M-8),
// eyebrow above breadcrumb, refined section padding, and a Service JSON-LD
// emitter wrapping the page (audit H-10).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import { getUiStringsServer } from "@/services/uiStrings";
import {
  getServiceBySlugServer,
  listServicesServer,
} from "@/services/services";
import { getPricingForServiceServer } from "@/services/pricing";
import { getSettingsServer } from "@/services/settings";
import { ApiError } from "@/lib/api-errors";
import { createT } from "@/lib/i18n/t";
import {
  buildBreadcrumbJsonLd,
  buildMetadata,
  buildServiceJsonLd,
} from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";
import { toTelHref } from "@/utils/formatters";
import {
  Breadcrumb,
  ConcessionBadge,
  Container,
  Markdown,
  ScrollReveal,
} from "@/components/shared";
import { Button } from "@/components/ui";
import {
  PricingSnapshot,
  RelatedServices,
  ServiceDetailHeader,
} from "@/components/features/services";

export const revalidate = 300;

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const services = await listServicesServer("de");
    return services.map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [stringsRes, service] = await Promise.all([
      getUiStringsServer("de"),
      getServiceBySlugServer(slug, "de"),
    ]);
    const t = createT(stringsRes.strings, "de");
    const altPath = `/en/services/${service.slug_en}`;
    return buildMetadata({
      title: service.meta_title || `${service.title} — ${t("services.page.title")}`,
      description: service.meta_description || service.short_description,
      path: `/dienstleistungen/${service.slug_de}`,
      alternatePath: altPath,
      locale: "de",
      ogImage: service.og_image_url ?? service.hero_image_url ?? undefined,
    });
  } catch {
    return { title: "—" };
  }
}

export default async function ServiceDetailDe({ params }: PageParams) {
  const { slug } = await params;
  let stringsRes;
  let service;
  let allServices;
  let settings;
  try {
    [stringsRes, service, allServices, settings] = await Promise.all([
      getUiStringsServer("de"),
      getServiceBySlugServer(slug, "de"),
      listServicesServer("de"),
      getSettingsServer("de"),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  let pricing: Awaited<ReturnType<typeof getPricingForServiceServer>> = [];
  try {
    pricing = await getPricingForServiceServer(slug, "de");
  } catch {
    pricing = [];
  }

  const t = createT(stringsRes.strings, "de");
  const others = allServices.filter((s) => s.id !== service.id);

  return (
    <>
      {/* Breadcrumb + header */}
      <section className="bg-cream">
        <Container className="pt-12 pb-6 md:pt-16">
          <Breadcrumb
            crumbs={[
              { name: t("nav.home"), href: "/" },
              { name: t("services.page.title"), href: "/dienstleistungen" },
              { name: service.title, href: `/dienstleistungen/${service.slug}` },
            ]}
          />
        </Container>
      </section>

      <ServiceDetailHeader t={t} service={service} bookingPath="/buchen" />

      {/* Long description with drop-cap */}
      {service.long_description && (
        <section className="bg-cream">
          <Container className="py-section">
            <ScrollReveal>
              <div className="prose-base drop-cap text-[17px] leading-[1.75] text-ink/90">
                <Markdown source={service.long_description} />
              </div>
            </ScrollReveal>
          </Container>
        </section>
      )}

      {/* Pricing snapshot */}
      <PricingSnapshot
        t={t}
        categories={pricing}
        pricingHref="/preise"
        bookingHref={`/buchen?service=${service.slug}`}
        locale="de"
      />

      {/* Related services */}
      <RelatedServices t={t} services={others} hrefBase="/dienstleistungen" />

      {/* Final CTA — service-specific */}
      <section className="relative overflow-hidden bg-ink text-cream">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
        />
        <Container className="py-section text-center md:py-section-lg">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
            {service.title}
          </p>
          <h2 className="mx-auto mt-4 max-w-3xl font-serif text-section md:text-display-md">
            {t("home.final_cta.heading")}
          </h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href={`/buchen?service=${service.slug}`}>
              <Button
                size="lg"
                variant="inverse"
                trailingIcon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
              >
                {t("home.hero.cta_book")}
              </Button>
            </Link>
            <a href={toTelHref(settings.phone)}>
              <Button
                size="lg"
                variant="outline"
                leadingIcon={<Phone className="h-4 w-4" aria-hidden="true" strokeWidth={1.5} />}
                className="border-cream/40 text-cream hover:bg-cream/5"
              >
                <span className="tabular-nums">{settings.phone}</span>
              </Button>
            </a>
          </div>
          <div className="mt-14 flex justify-center">
            <ConcessionBadge settings={settings} tone="dark" />
          </div>
        </Container>
      </section>

      <JsonLd data={buildServiceJsonLd(service, settings)} />
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: t("nav.home"), url: "/" },
          { name: t("services.page.title"), url: "/dienstleistungen" },
          { name: service.title, url: `/dienstleistungen/${service.slug}` },
        ])}
      />
    </>
  );
}
