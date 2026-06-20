import type { TFunction } from "@/lib/i18n/t";
import type { LegalPagePublic, Locale } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { Container, Markdown } from "@/components/shared";
import { pickT } from "@/lib/i18n/pick";
import { formatDate } from "@/utils/formatters";
import { LegalDisclaimer } from "./LegalDisclaimer";

const LEGAL_BANNER_IMAGE =
  "/others/legal.avif";

interface LegalPageRendererProps {
  t: TFunction;
  page: LegalPagePublic;
  locale: Locale;
  path?: string;
}

function getPageTypeLabel(path: string | undefined, locale: Locale): string {
  if (path?.includes("privacy") || path?.includes("datenschutz")) {
    return locale === "de" ? "Datenschutz" : "Privacy";
  }
  if (path?.includes("terms") || path?.includes("agb")) {
    return locale === "de" ? "Bedingungen" : "Terms";
  }
  return locale === "de" ? "Rechtliches" : "Legal";
}

export function LegalPageRenderer({ t, page, locale, path }: LegalPageRendererProps) {
  const pageTypeLabel = getPageTypeLabel(path, locale);

  return (
    <>
      <section className="relative overflow-hidden border-t border-[color:var(--color-border-soft)] bg-[var(--color-text-primary)]">
        <div className="absolute inset-0">
          <Image
            src={LEGAL_BANNER_IMAGE}
            alt={page.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,26,23,0.84),rgba(24,26,23,0.58))]" />
        </div>
        <Container className="relative py-10 md:py-12">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(247,244,234,0.72)]">
              <li>
                <Link
                  href={locale === "de" ? "/" : "/en"}
                  className="transition-colors duration-base hover:text-[var(--color-text-on-strong)]"
                >
                  {pickT(t, "nav.home", locale === "de" ? "Startseite" : "Home")}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[var(--color-text-on-strong)]">{page.title}</li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-secondary)]">
              {pageTypeLabel}
            </p>
            <h1 className="mt-3 font-serif text-[42px] leading-[0.98] tracking-tight text-[var(--color-text-on-strong)] md:text-[60px]">
              {page.title}
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[rgba(247,244,234,0.84)] md:text-[16px]">
              {locale === "de"
                ? "Rechtliche Informationen klar strukturiert und jederzeit nachvollziehbar."
                : "Legal information presented clearly and structured for straightforward reading."}
            </p>
            {page.published_at && (
              <p className="mt-4 text-[11.5px] leading-relaxed text-[rgba(247,244,234,0.68)]">
                {locale === "de" ? "Stand:" : "Last updated:"}{" "}
                {formatDate(page.published_at, locale)}
                {page.version_number != null && (
                  <>
                    {" "}· {locale === "de" ? "Version" : "Version"} {page.version_number}
                  </>
                )}
              </p>
            )}
          </div>
        </Container>
      </section>

      <section className="bg-[var(--color-bg-page)]">
        <Container className="py-section">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.74fr)_minmax(260px,0.26fr)] lg:gap-8">
            <div className="shadow-premium border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-5 md:p-6">
              <Markdown source={page.body} />
            </div>

            <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
              <div className="border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-primary)]">
                  {locale === "de" ? "Dokument" : "Document"}
                </p>
                <h2 className="mt-2 font-serif text-[22px] leading-tight tracking-tight text-[var(--color-text-primary)]">
                  {page.title}
                </h2>
                {page.published_at && (
                  <dl className="mt-5 space-y-3 border-t border-[color:var(--color-border-soft)] pt-4 text-[13px] leading-relaxed">
                    <div>
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-primary)]">
                        {locale === "de" ? "Stand" : "Updated"}
                      </dt>
                      <dd className="mt-1 text-[var(--color-text-secondary)]">
                        {formatDate(page.published_at, locale)}
                      </dd>
                    </div>
                    {page.version_number != null && (
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-accent-primary)]">
                          {locale === "de" ? "Version" : "Version"}
                        </dt>
                        <dd className="mt-1 text-[var(--color-text-secondary)]">
                          {page.version_number}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
              </div>

              {locale === "en" && <LegalDisclaimer />}
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
