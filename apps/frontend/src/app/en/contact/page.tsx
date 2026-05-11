// apps/frontend/src/app/en/contact/page.tsx
// Phase 3d polish — English contact page mirroring (public)/kontakt/page.tsx.

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
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="block h-px w-10 bg-gold" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
                {t("contact.page.eyebrow") || "Contact"}
              </p>
            </div>
            <h1 className="mt-4 font-serif text-section md:text-hero">
              {t("contact.page.title")}
            </h1>
            <p className="mt-4 text-body-lg text-mute">{t("contact.page.subhead")}</p>
          </header>
        </Container>
      </section>

      <section className="bg-cream">
        <Container className="grid gap-16 py-section md:grid-cols-12 md:gap-12">
          <aside className="md:col-span-5">
            <p className="label-eyebrow">{t("contact.methods.eyebrow") || "Direct"}</p>
            <h2 className="mt-3 font-serif text-section">{t("contact.methods.heading")}</h2>
            <p className="mt-3 text-mute">{t("contact.methods.intro")}</p>
            <div className="mt-8">
              <ContactMethods t={t} settings={settings} />
            </div>
          </aside>
          <div className="md:col-span-7">
            <p className="label-eyebrow">{t("contact.form.eyebrow") || "Inquiry"}</p>
            <h2 className="mt-3 font-serif text-section">{t("contact.form.heading")}</h2>
            <p className="mt-3 text-mute">{t("contact.form.intro")}</p>
            <div className="mt-8">
              <ContactForm id="contact-form" />
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-paper">
        <Container className="py-section">
          <header className="mb-8 max-w-3xl">
            <p className="label-eyebrow">{t("contact.map.eyebrow") || "Location"}</p>
            <h2 className="mt-3 font-serif text-section">{t("contact.map.heading")}</h2>
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
