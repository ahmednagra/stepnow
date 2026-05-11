// src/app/en/services/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
import { Breadcrumb, Container, Markdown } from "@/components/shared";
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
    const altPath = `/dienstleistungen/${service.slug_de}`;
    return buildMetadata({
      title: service.meta_title || `${service.title} — ${t("services.page.title")}`,
      description: service.meta_description || service.short_description,
      path: `/en/services/${service.slug_en}`,
      alternatePath: altPath,
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

  let pricing = [] as Awaited<ReturnType<typeof getPricingForServiceServer>>;
  try {
    pricing = await getPricingForServiceServer(slug, "en");
  } catch {
    pricing = [];
  }

  const t = createT(stringsRes.strings, "en");
  const path = `/en/services/${service.slug_en}`;
  const altPath = `/dienstleistungen/${service.slug_de}`;
  const crumbs = [
    { name: t("nav.home"), href: "/en" },
    { name: t("services.page.title"), href: "/en/services" },
    { name: service.title, href: path },
  ];

  return (
    <>
      <ServiceDetailHeader
        service={service}
        settings={settings}
        bookingHref="/en/book"
        t={t}
        locale="en"
      />

      <section className="bg-cream">
        <Container className="py-section">
          <Breadcrumb crumbs={crumbs} />
          <div className="prose-base mt-10">
            <Markdown source={service.long_description} />
          </div>
        </Container>
      </section>

      <PricingSnapshot
        t={t}
        categories={pricing}
        pricingHref="/en/pricing"
        bookingHref="/en/book"
        locale="en"
      />

      <RelatedServices t={t} current={service} others={allServices} locale="en" />

      <JsonLd data={buildServiceJsonLd(service, settings, path)} />
      <JsonLd data={buildBreadcrumbJsonLd(crumbs)} />
      <link rel="alternate" hrefLang="de" href={altPath} />
    </>
  );
}
