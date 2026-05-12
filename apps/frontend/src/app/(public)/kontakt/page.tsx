// apps/frontend/src/app/(public)/kontakt/page.tsx
// Option A layout — Row 1: Form (left) + Methods/Map sidebar (right) with
// matched heights, no dead space. Row 2: 4-up FAQ grid with answers always
// visible (no accordion clicks). FAQPage JSON-LD emitted for SEO.

import type { Metadata } from "next";
import { getUiStringsServer } from "@/services/uiStrings";
import { getSettingsServer } from "@/services/settings";
import { listFaqsServer } from "@/services/faqs";
import { createT } from "@/lib/i18n/t";
import { buildLocalBusinessJsonLd, buildFaqPageJsonLd, buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";
import { Container } from "@/components/shared";
import {
  ContactForm,
  ContactMap,
  ContactMethods,
  ContactFaqGrid,
} from "@/components/features/contact";
import { pickT } from "@/lib/i18n/pick";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const stringsRes = await getUiStringsServer("de");
  const t = createT(stringsRes.strings, "de");
  return buildMetadata({
    title: t("contact.page.title"),
    description: t("contact.page.subhead"),
    path: "/kontakt",
    locale: "de",
  });
}

export default async function ContactPageDe() {
  const [stringsRes, settings, faqs] = await Promise.all([
    getUiStringsServer("de"),
    getSettingsServer("de"),
    listFaqsServer("de"),
  ]);
  const t = createT(stringsRes.strings, "de");
  const topFaqs = faqs.slice(0, 4);

  return (
    <>
      <section className="bg-cream">
        <Container className="pt-8 pb-10 md:pt-10 md:pb-14">
          {/* === Page header — asymmetric eyebrow/H1 left, subhead right === */}
          <header className="mb-7 flex flex-col gap-2 md:mb-9 md:flex-row md:items-end md:justify-between md:gap-6">
            <div>
              <p className="label-eyebrow">{pickT(t, "contact.page.eyebrow", "Kontakt")}</p>
              <h1 className="mt-1 font-serif text-[30px] leading-none tracking-tight md:text-[38px]">
                {t("contact.page.title")}
              </h1>
            </div>
            <p className="max-w-md text-[13.5px] text-mute md:text-right">
              {t("contact.page.subhead")}
            </p>
          </header>

          {/* === ROW 1 — Form (left) + Methods/Map (right) === */}
          <div className="grid gap-8 md:grid-cols-[1fr_380px] md:gap-10">
            {/* Form */}
            <div>
              <p className="label-eyebrow text-[10px]">
                {pickT(t, "contact.form.eyebrow", "Anfrage")}
              </p>
              <h2 className="mt-1 mb-4 font-serif text-[22px] leading-tight tracking-tight">
                {t("contact.form.heading")}
              </h2>
              <ContactForm id="contact-form" />
            </div>

            {/* Sidebar — Methods + Map thumbnail */}
            <aside className="flex flex-col gap-4">
              <div>
                <p className="label-eyebrow text-[10px]">
                  {pickT(t, "contact.methods.eyebrow", "Direkt")}
                </p>
                <h2 className="mt-1 mb-3 font-serif text-[22px] leading-tight tracking-tight">
                  {t("contact.methods.heading")}
                </h2>
                <ContactMethods t={t} settings={settings} />
              </div>
              <ContactMap settings={settings} compact />
            </aside>
          </div>

          {/* === ROW 2 — 4-up FAQ grid === */}
          {topFaqs.length > 0 && (
            <div id="faq" className="mt-12 border-t border-line pt-10 md:mt-14 md:pt-12">
              <div className="mb-5 flex flex-col gap-2 md:mb-7 md:flex-row md:items-end md:justify-between md:gap-6">
                <div>
                  <p className="label-eyebrow text-[10px]">
                    {pickT(t, "contact.faq.eyebrow", "Häufige Fragen")}
                  </p>
                  <h2 className="mt-1 font-serif text-[22px] leading-tight tracking-tight md:text-[26px]">
                    {pickT(t, "home.faqs.heading", "Antworten auf einen Blick")}
                  </h2>
                </div>
              </div>
              <ContactFaqGrid faqs={topFaqs} />
            </div>
          )}
        </Container>
      </section>

      <JsonLd data={buildLocalBusinessJsonLd(settings)} />
      {topFaqs.length > 0 && <JsonLd data={buildFaqPageJsonLd(topFaqs)} />}
    </>
  );
}
