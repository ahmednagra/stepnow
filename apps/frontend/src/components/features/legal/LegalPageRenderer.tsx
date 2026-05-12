import type { TFunction } from "@/lib/i18n/t";
import type { LegalPagePublic, Locale } from "@/types";
import { Container, Markdown } from "@/components/shared";
import { formatDate } from "@/utils/formatters";
import { LegalDisclaimer } from "./LegalDisclaimer";

interface LegalPageRendererProps {
  t: TFunction;
  page: LegalPagePublic;
  locale: Locale;
  /** Kept for API compatibility; unused since breadcrumb removal. */
  path?: string;
}

export function LegalPageRenderer({ page, locale }: LegalPageRendererProps) {
  return (
    <section className="bg-cream">
      <Container className="pt-10 pb-section md:pt-14">
        <header className="max-w-prose">
          <h1 className="font-serif text-section md:text-hero">{page.title}</h1>
          {page.published_at && (
            <p className="mt-2 text-sm text-mute">
              {locale === "de" ? "Stand:" : "Last updated:"} {formatDate(page.published_at, locale)}
              {page.version_number != null && (
                <>
                  {" "}· {locale === "de" ? "Version" : "Version"} {page.version_number}
                </>
              )}
            </p>
          )}
        </header>
        {locale === "en" && (
          <div className="mt-5 max-w-prose">
            <LegalDisclaimer />
          </div>
        )}
        <div className="mt-8 max-w-prose">
          <Markdown source={page.body} />
        </div>
      </Container>
    </section>
  );
}
