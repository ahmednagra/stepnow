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
    <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
      {faqs.map((faq, idx) => (
        <li
          key={faq.id}
          className="flex flex-col gap-3 bg-cream p-5 md:p-6"
        >
          <span
            aria-hidden="true"
            className="font-serif text-[28px] leading-none tabular-nums text-gold"
          >
            {String(idx + 1).padStart(2, "0")}
          </span>
          <h3 className="text-[14px] font-medium leading-snug tracking-tight text-ink">
            {faq.question}
          </h3>
          <div className="mt-auto">
            <Markdown
              source={faq.answer}
              className="text-[12.5px] leading-[1.55] text-mute"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
