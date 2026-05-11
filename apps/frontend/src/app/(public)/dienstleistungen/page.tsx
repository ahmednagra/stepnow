// apps/frontend/src/app/(public)/dienstleistungen/page.tsx
// Phase 3d polish — German services list page with eyebrow header and
// alternating-layout service rows.

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
  const stringsRes = await getUiStringsServer("de");
  const t = createT(stringsRes.strings, "de");
  return buildMetadata({
    title: t("services.page.title"),
    description: t("services.page.subhead"),
    path: "/dienstleistungen",
    locale: "de",
  });
}

export default async function ServicesListDe() {
  const [stringsRes, services] = await Promise.all([
    getUiStringsServer("de"),
    listServicesServer("de"),
  ]);
  const t = createT(stringsRes.strings, "de");

  return (
    <>
      <section className="bg-cream">
        <Container className="pt-12 pb-6 md:pt-16">
          <Breadcrumb
            crumbs={[
              { name: t("nav.home"), href: "/" },
              { name: t("services.page.title"), href: "/dienstleistungen" },
            ]}
          />
          <header className="mt-8 max-w-3xl">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="block h-px w-10 bg-gold" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
                {pickT(t, "services.page.eyebrow", "Leistungen")}
              </p>
            </div>
            <h1 className="mt-4 font-serif text-section md:text-hero">
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
            detailHref={`/dienstleistungen/${s.slug}`}
            index={idx}
            t={t}
          />
        ))}
      </section>
    </>
  );
}
