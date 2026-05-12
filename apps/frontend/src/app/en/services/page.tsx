import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { listServicesServer } from "@/services/services";
import { createT } from "@/lib/i18n/t";
import { buildMetadata } from "@/lib/seo";
import { Container } from "@/components/shared";
import { ServiceListItem } from "@/components/features/services/ServiceListItem";

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
        <Container className="pt-10 pb-6 md:pt-14 md:pb-8">
          <header className="max-w-3xl">
            <h1 className="font-serif text-section md:text-hero">{t("services.page.title")}</h1>
            <p className="mt-3 text-body-lg text-mute">{t("services.page.subhead")}</p>
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
