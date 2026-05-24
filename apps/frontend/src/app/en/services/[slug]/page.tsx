import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getUiStringsServer } from "@/services/uiStrings";
import { getServiceBySlugServer, listServicesServer } from "@/services/services";
import { getPricingForServiceServer } from "@/services/pricing";
import { getSettingsServer } from "@/services/settings";
import { ApiError } from "@/lib/api-errors";
import { createT } from "@/lib/i18n/t";
import { buildMetadata, buildServiceJsonLd } from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";
import {
  Container,
  Markdown,
  ScrollReveal,
  SlugMapBridge,
} from "@/components/shared";
import {
  PricingSnapshot,
  RelatedServices,
  ServiceDetailHeader,
} from "@/components/features/services";
import { pickT } from "@/lib/i18n/pick";
import { getServiceHeroImage } from "@/components/features/pricing/PricingSections";

export const revalidate = 300;

interface PageParams {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const services = await listServicesServer("en");
    return services.map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params;
  try {
    const [stringsRes, service] = await Promise.all([
      getUiStringsServer("en"),
      getServiceBySlugServer(slug, "en"),
    ]);
    const t = createT(stringsRes.strings, "en");
    return buildMetadata({
      title: service.meta_title || `${service.title} — ${t("services.page.title")}`,
      description: service.meta_description || service.short_description,
      path: `/en/services/${service.slug_en}`,
      alternatePath: `/dienstleistungen/${service.slug_de}`,
      locale: "en",
      ogImage: service.og_image_url ?? service.hero_image_url ?? undefined,
    });
  } catch {
    return { title: "—" };
  }
}

export default async function ServiceDetailEn({ params }: PageParams) {
  const { slug } = await params;
  let stringsRes;
  let service;
  let allServices;
  let settings;
  try {
    [stringsRes, service, allServices, settings] = await Promise.all([
      getUiStringsServer("en"),
      getServiceBySlugServer(slug, "en"),
      listServicesServer("en"),
      getSettingsServer("en"),
    ]);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  let pricing: Awaited<ReturnType<typeof getPricingForServiceServer>> = [];
  try {
    pricing = await getPricingForServiceServer(slug, "en");
  } catch {
    pricing = [];
  }

  const t = createT(stringsRes.strings, "en");
  const others = allServices.filter((s) => s.id !== service.id);
  const heroImage = getServiceHeroImage(service.slug, service.hero_image_url);

  return (
    <>
      <SlugMapBridge
        slugMap={{
          [`/en/services/${service.slug_en}`]: `/dienstleistungen/${service.slug_de}`,
        }}
      />
      <section className="relative overflow-hidden border-t border-[color:var(--color-border-soft)] bg-[var(--color-text-primary)]">
        <div className="absolute inset-0">
          <Image src={heroImage} alt={service.title} fill sizes="100vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,26,23,0.84),rgba(24,26,23,0.58))]" />
        </div>
        <Container className="relative py-16 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(247,244,234,0.72)]">
              <li><Link href="/en" className="transition-colors duration-base hover:text-[var(--color-text-on-strong)]">{pickT(t, "nav.home", "Home")}</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/en/services" className="transition-colors duration-base hover:text-[var(--color-text-on-strong)]">{t("services.page.title")}</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-[var(--color-text-on-strong)]">{service.title}</li>
            </ol>
          </nav>
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-secondary)]">
              {pickT(t, "services.page.eyebrow", "Services")}
            </p>
            <h1 className="mt-3 font-serif text-[42px] leading-[0.98] tracking-tight text-[var(--color-text-on-strong)] md:text-[60px]">
              {service.title}
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[rgba(247,244,234,0.84)] md:text-[16px]">
              {service.short_description}
            </p>
          </div>
        </Container>
      </section>
      <ServiceDetailHeader t={t} service={service} bookingPath="/en/book" />
      {service.long_description && (
        <section className="bg-[var(--color-bg-page)]">
          <Container className="py-section">
            <ScrollReveal>
              <div className="prose-base drop-cap text-[17px] leading-[1.75] text-[var(--color-text-secondary)]">
                <Markdown source={service.long_description} />
              </div>
            </ScrollReveal>
          </Container>
        </section>
      )}
      <PricingSnapshot
        t={t}
        categories={pricing}
        pricingHref="/en/pricing"
        bookingHref={`/en/book?service=${service.slug}`}
        locale="en"
      />
      <RelatedServices t={t} services={others} hrefBase="/en/services" />
      <JsonLd data={buildServiceJsonLd(service, settings, `/en/services/${service.slug}`)} />
    </>
  );
}
