// apps/frontend/src/components/features/contact/ContactFaqGrid.tsx
// Option A layout — 4-up FAQ grid with answers always visible (no accordion).
// Each cell shows a gold serif numeral (01–04), the question, and the answer.
// On tablet collapses to 2×2; on mobile to a single column.
//
// Used on the contact page as the second row of content. The homepage and
// service-detail pages continue to use the accordion variant (FaqTeaser).

import type { FaqPublic } from "@/types";
import { Markdown } from "@/components/shared";

interface ContactFaqGridProps {
  faqs: FaqPublic[];
}

export function ContactFaqGrid({ faqs }: ContactFaqGridProps) {
  if (faqs.length === 0) return null;

  return (
    <ul className="grid gap-px border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)] sm:grid-cols-2 lg:grid-cols-4">
      {faqs.map((faq, idx) => (
        <li
          key={faq.id}
          className="flex flex-col gap-4 bg-[var(--color-bg-surface)] p-5 transition-colors duration-base hover:bg-[var(--color-bg-page)] md:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <span
              aria-hidden="true"
              className="font-serif text-[28px] leading-none tabular-nums text-[color:rgba(168,134,90,0.30)]"
            >
              {String(idx + 1).padStart(2, "0")}
            </span>
            <span className="inline-flex h-2.5 w-2.5 shrink-0 bg-[var(--color-accent-primary)]" aria-hidden="true" />
          </div>
          <h3 className="text-[14px] font-medium leading-snug tracking-tight text-[var(--color-text-primary)]">
            {faq.question}
          </h3>
          <div className="mt-auto">
            <Markdown
              source={faq.answer}
              className="text-[12.5px] leading-[1.55] text-[var(--color-text-secondary)]"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
