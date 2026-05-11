// apps/frontend/src/app/en/services/page.tsx
// Phase 3d polish — English services list page mirror.

import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumb, Container } from "@/components/shared";
import { ServiceListItem } from "@/components/features/services/ServiceListItem";
import { pickT } from "@/lib/i18n/pick";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("en");
  const t = createT(stringsRes.strings, "en");
  return buildMetadata({
    title: t("services.page.title"),
    description: t("services.page.subhead"),
    path: "/en/services",
    locale: "en",
  });
}

export default async function ServicesListEn() {
  const [stringsRes, services] = await Promise.all([
    getUiStringsServer("en"),
    listServicesServer("en"),
  ]);
  const t = createT(stringsRes.strings, "en");

  return (
    <>
      <section className="bg-cream">
        <Container className="pt-7 pb-0 md:pt-10 md:pb-0">
          <Breadcrumb
            crumbs={[
              { name: t("nav.home"), href: "/en" },
              { name: t("services.page.title"), href: "/en/services" },
            ]}
          />
          <header className="mt-5 max-w-3xl">
            <h1 className="font-serif text-section md:text-hero">
              {t("services.page.title")}
            </h1>
            <p className="mt-4 text-body-lg text-mute">{t("services.page.subhead")}</p>
          </header>
        </Container>
      </section>

      <section className="bg-cream">
        {services.map((s, idx) => (
          <ServiceListItem
            key={s.id}
            service={s}
            detailHref={`/en/services/${s.slug}`}
            index={idx}
            t={t}
          />
        ))}
      </section>
    </>
  );
}
