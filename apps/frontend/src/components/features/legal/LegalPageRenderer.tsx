// src/components/features/legal/LegalPageRenderer.tsx
import type { TFunction } from "@/lib/i18n/t";
import type { LegalPagePublic, Locale } from "@/types";
import { Breadcrumb, Container, Markdown } from "@/components/shared";
import { formatDate } from "@/utils/formatters";
import { LegalDisclaimer } from "./LegalDisclaimer";

interface LegalPageRendererProps {
  t: TFunction;
  page: LegalPagePublic;
  locale: Locale;
  /** Absolute path of this page (e.g. "/impressum"). */
  path: string;
}

/**
 * Renders a versioned legal page from the backend. Single-brace placeholder
 * resolution ({site_settings.business_name}, etc.) is done server-side; this
 * component just renders the resolved markdown.
 */
export function LegalPageRenderer({ t, page, locale, path }: LegalPageRendererProps) {
  const homeHref = locale === "de" ? "/" : "/en";
  return (
    <section className="bg-cream">
      <Container className="pt-12 pb-section md:pt-16">
        <Breadcrumb
          crumbs={[
            { name: t("nav.home"), href: homeHref },
            { name: page.title, href: path },
          ]}
        />

        <header className="mt-8 max-w-prose">
          <h1 className="font-serif text-section md:text-hero">{page.title}</h1>
          {page.published_at && (
            <p className="mt-3 text-sm text-mute">
              {locale === "de" ? "Stand:" : "Last updated:"}{" "}
              {formatDate(page.published_at, locale)}
              {page.version_number != null && (
                <>
                  {" "}
                  · {locale === "de" ? "Version" : "Version"} {page.version_number}
                </>
              )}
            </p>
          )}
        </header>

        {locale === "en" && (
          <div className="mt-6 max-w-prose">
            <LegalDisclaimer />
          </div>
        )}

        <div className="mt-10 max-w-prose">
          <Markdown source={page.body} />
        </div>
      </Container>
    </section>
  );
}
