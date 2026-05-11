// src/app/en/contact/page.tsx
import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { listFaqsServer } from "@/services/faqs";
import { createT } from "@/lib/i18n/t";
import { buildLocalBusinessJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";
import { Breadcrumb, Container } from "@/components/shared";
import {
  ContactForm,
  ContactMap,
  ContactMethods,
} from "@/components/features/contact";
import { FaqTeaser } from "@/components/features/home";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("en");
  const t = createT(stringsRes.strings, "en");
  return buildMetadata({
    title: t("contact.page.title"),
    description: t("contact.page.subhead"),
    path: "/en/contact",
    locale: "en",
  });
}

export default async function ContactPageEn() {
  const [stringsRes, settings, faqs] = await Promise.all([
    getUiStringsServer("en"),
    getSettingsServer("en"),
    listFaqsServer("en"),
  ]);
  const t = createT(stringsRes.strings, "en");

  return (
    <>
      <section className="bg-cream">
        <Container className="pt-12 pb-6 md:pt-16">
          <Breadcrumb
            crumbs={[
              { name: t("nav.home"), href: "/en" },
              { name: t("contact.page.title"), href: "/en/contact" },
            ]}
          />
          <header className="mt-8 max-w-3xl">
            <h1 className="font-serif text-section md:text-hero">{t("contact.page.title")}</h1>
            <p className="mt-4 text-body-lg text-mute">{t("contact.page.subhead")}</p>
          </header>
        </Container>
      </section>

      <section className="bg-cream">
        <Container className="grid gap-12 py-section md:grid-cols-2">
          <div>
            <h2 className="font-serif text-sub">{t("contact.methods.heading")}</h2>
            <p className="mt-3 text-mute">{t("contact.methods.intro")}</p>
            <div className="mt-6">
              <ContactMethods t={t} settings={settings} />
            </div>
          </div>
          <div>
            <h2 className="font-serif text-sub">{t("contact.form.heading")}</h2>
            <p className="mt-3 text-mute">{t("contact.form.intro")}</p>
            <div className="mt-6">
              <ContactForm id="contact-form" />
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-cream">
        <Container className="py-section">
          <header className="mb-8 max-w-3xl">
            <h2 className="font-serif text-section">{t("contact.map.heading")}</h2>
          </header>
          <ContactMap t={t} settings={settings} />
        </Container>
      </section>

      <div id="faq">
        <FaqTeaser t={t} faqs={faqs} locale="en" />
      </div>

      <JsonLd data={buildLocalBusinessJsonLd(settings)} />
    </>
  );
}
