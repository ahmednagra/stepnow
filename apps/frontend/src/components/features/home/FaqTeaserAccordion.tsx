"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import type { FaqPublic } from "@/types";
import { Markdown } from "@/components/shared";
import { cn } from "@/utils/cn";

interface FaqTeaserAccordionProps {
  items: FaqPublic[];
}

export function FaqTeaserAccordion({ items }: FaqTeaserAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <ul className="divide-y divide-[color:var(--color-border-soft)]">
      {items.map((faq) => {
        const isOpen = openId === faq.id;
        return (
          <li key={faq.id}>
            <button
              type="button"
              onClick={() => setOpenId(faq.id)}
              aria-expanded={isOpen}
              className="flex w-full items-start justify-between gap-6 px-6 py-5 text-left text-[var(--color-text-primary)] md:px-8"
            >
              <span className="text-[16px] font-semibold leading-snug tracking-tight md:text-[17px]">
                {faq.question}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)] text-[var(--color-text-secondary)] transition-all duration-base ease-out-premium",
                  isOpen && "rotate-45 border-[color:var(--color-accent-primary)] text-[var(--color-accent-primary)]",
                )}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              </span>
            </button>
            {isOpen && (
              <div className="prose-faq px-6 pb-5 pr-14 text-[var(--color-text-secondary)] md:px-8">
                <Markdown source={faq.answer} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
