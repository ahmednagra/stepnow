// apps/frontend/src/components/features/contact/CompactFaq.tsx
// Compact FAQ accordion for the right sidebar of the contact page.
// Uses native <details>/<summary> so it works without JS and stays SSR-safe.
// Limits to N questions (default 4) to keep the section within a viewport.

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { FaqPublic, Locale } from "@/types";
import { pickT } from "@/lib/i18n/pick";

interface CompactFaqProps {
  t: TFunction;
  faqs: FaqPublic[];
  locale: Locale;
  /** Max number of questions to render. Default 4. */
  limit?: number;
}

export function CompactFaq({ t, faqs, locale, limit = 4 }: CompactFaqProps) {
  const items = faqs.slice(0, limit);
  const allFaqsHref = locale === "de" ? "/faq" : "/en/faq";

  if (items.length === 0) {
    return (
      <p className="text-[12.5px] leading-relaxed text-mute">
        {pickT(t, "contact.faq.empty", "Fragen werden in Kürze beantwortet.")}
      </p>
    );
  }

  return (
    <div>
      <ul className="flex flex-col gap-px border-y border-line bg-line">
        {items.map((faq) => (
          <li key={faq.id} className="bg-cream">
            <details className="group p-3">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-[12.5px] font-medium leading-snug text-ink marker:hidden">
                <span className="flex-1">{faq.question}</span>
                <ChevronDown
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-deep transition-transform duration-base ease-out-premium group-open:rotate-180"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </summary>
              <p className="mt-2 text-[12px] leading-relaxed text-mute">
                {faq.answer}
              </p>
            </details>
          </li>
        ))}
      </ul>
      <Link
        href={allFaqsHref}
        className="mt-3 inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gold-deep transition-colors duration-base hover:text-ink"
      >
        {pickT(t, "home.faqs.cta", "Alle Fragen ansehen")} →
      </Link>
    </div>
  );
}
