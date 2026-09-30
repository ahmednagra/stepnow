// apps/frontend/src/components/features/faq/FaqPageContent.tsx
// The full FAQ page (/faq, /en/faq): hero, one section per category, closing contact card, plus the
// site's only FAQPage + BreadcrumbList JSON-LD. Server component — answers are real HTML inside
// native <details>, so they are crawlable and work without JavaScript.
//
// Grouping: general → booking → pricing → one group per service (FAQ category = the service's
// slug_de, titled with the service name) → anything else under "Weitere Fragen".

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone, Plus } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { FaqPublic, Locale, ServicePublic, SettingsPublic } from "@/types";
import { Container, Markdown } from "@/components/shared";
import { Button } from "@/components/ui";
import { buildBreadcrumbJsonLd, buildFaqPageJsonLd } from "@/lib/seo";
import { JsonLd } from "@/utils/json-ld";
import { toTelHref } from "@/utils/formatters";

const FAQ_IMAGE = "/others/faq.avif";

const FIXED_GROUPS = [
  { id: "general", labelKey: "faq.category.general" },
  { id: "booking", labelKey: "faq.category.booking" },
  { id: "pricing", labelKey: "faq.category.pricing" },
] as const;

interface FaqGroup {
  id: string;
  title: string;
  items: FaqPublic[];
}

function groupFaqs(faqs: FaqPublic[], services: ServicePublic[], t: TFunction): FaqGroup[] {
  const byCategory = new Map<string, FaqPublic[]>();
  for (const faq of faqs) byCategory.set(faq.category, [...(byCategory.get(faq.category) ?? []), faq]);
  const take = (category: string) => {
    const items = byCategory.get(category) ?? [];
    byCategory.delete(category);
    return items;
  };
  const groups: FaqGroup[] = [
    ...FIXED_GROUPS.map((g) => ({ id: g.id, title: t(g.labelKey), items: take(g.id) })),
    ...services.map((s) => ({ id: s.slug_de, title: s.title, items: take(s.slug_de) })),
  ];
  groups.push({ id: "other", title: t("faq.category.other"), items: [...byCategory.values()].flat() });
  return groups.filter((g) => g.items.length > 0);
}

interface FaqPageContentProps {
  t: TFunction;
  locale: Locale;
  faqs: FaqPublic[];
  services: ServicePublic[];
  settings: SettingsPublic;
}

export function FaqPageContent({ t, locale, faqs, services, settings }: FaqPageContentProps) {
  const groups = groupFaqs(faqs, services, t);
  const homeHref = locale === "de" ? "/" : "/en";
  const pageHref = locale === "de" ? "/faq" : "/en/faq";
  const contactHref = locale === "de" ? "/kontakt" : "/en/contact";
  const title = t("faq.page.title");

  return (
    <>
      <section className="relative overflow-hidden border-t border-[color:var(--color-border-soft)] bg-[var(--color-text-primary)]">
        <div className="absolute inset-0">
          <Image src={FAQ_IMAGE} alt="" fill sizes="100vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,26,23,0.84),rgba(24,26,23,0.58))]" />
        </div>
        <Container className="relative py-16 md:py-20">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(247,244,234,0.72)]">
              <li>
                <Link href={homeHref} className="transition-colors duration-base hover:text-[var(--color-text-on-strong)]">
                  {t("nav.home")}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[var(--color-text-on-strong)]">{title}</li>
            </ol>
          </nav>
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-secondary)]">
              {t("faq.page.eyebrow")}
            </p>
            <h1 className="mt-3 font-serif text-[42px] leading-[0.98] tracking-tight text-[var(--color-text-on-strong)] md:text-[60px]">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[rgba(247,244,234,0.84)] md:text-[16px]">
              {t("faq.page.subhead")}
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-[var(--color-bg-page)]">
        <Container className="py-section">
          {groups.length === 0 ? (
            <p className="mx-auto max-w-xl border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-8 text-center text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              {t("faq.page.empty")}
            </p>
          ) : (
            <div className="grid gap-10 lg:grid-cols-[minmax(200px,0.28fr)_minmax(0,0.72fr)] lg:gap-12">
              <nav aria-label={title} className="lg:sticky lg:top-28 lg:self-start">
                <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-0 lg:border-l lg:border-[color:var(--color-border-soft)]">
                  {groups.map((g) => (
                    <li key={g.id}>
                      <a
                        href={`#faq-${g.id}`}
                        className="inline-flex border border-[color:var(--color-border-soft)] px-3 py-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors duration-base hover:text-[var(--color-accent-primary)] lg:border-0 lg:px-4 lg:py-2"
                      >
                        {g.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="flex flex-col gap-12">
                {groups.map((g) => (
                  <section key={g.id} id={`faq-${g.id}`} aria-labelledby={`faq-${g.id}-heading`} className="scroll-mt-28">
                    <h2
                      id={`faq-${g.id}-heading`}
                      className="font-serif text-[28px] leading-[1.1] tracking-tight text-[var(--color-text-primary)] md:text-[34px]"
                    >
                      {g.title}
                    </h2>
                    <ul className="mt-5 divide-y divide-[color:var(--color-border-soft)] border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]">
                      {g.items.map((faq) => (
                        <li key={faq.id}>
                          <details className="group">
                            <summary className="flex cursor-pointer list-none items-start justify-between gap-5 px-5 py-4 text-left text-[var(--color-text-primary)] md:px-6 [&::-webkit-details-marker]:hidden">
                              <span className="text-[15px] font-semibold leading-snug tracking-tight">{faq.question}</span>
                              <span
                                aria-hidden="true"
                                className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-text-secondary)] transition-transform duration-base group-open:rotate-45 group-open:border-[color:var(--color-accent-primary)] group-open:text-[var(--color-accent-primary)]"
                              >
                                <Plus className="h-3 w-3" strokeWidth={1.5} />
                              </span>
                            </summary>
                            <div className="px-5 pb-5 pr-12 md:px-6">
                              <Markdown source={faq.answer} className="text-[14px] leading-[1.65]" />
                            </div>
                          </details>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
          )}

          <div className="mt-14 flex flex-col gap-6 border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="max-w-xl">
              <h2 className="font-serif text-[26px] leading-tight tracking-tight text-[var(--color-text-primary)]">
                {t("faq.cta.heading")}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">{t("faq.cta.body")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a href={toTelHref(settings.phone)}>
                <Button size="sm" variant="secondary" leadingIcon={<Phone className="h-3.5 w-3.5" aria-hidden="true" strokeWidth={1.75} />}>
                  <span className="tabular-nums">{settings.phone}</span>
                </Button>
              </a>
              <Link href={contactHref}>
                <Button size="sm" trailingIcon={<ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}>
                  {t("faq.cta.contact")}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {faqs.length > 0 && <JsonLd data={buildFaqPageJsonLd(faqs)} />}
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: t("nav.home"), href: homeHref },
          { name: title, href: pageHref },
        ])}
      />
    </>
  );
}
