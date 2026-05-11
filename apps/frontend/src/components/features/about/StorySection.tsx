// apps/frontend/src/components/features/about/StorySection.tsx
// Phase 3d polish — addresses audit M-11.
//   • Portrait sits inside a hairline frame on the left (gold-edge corners).
//   • Story paragraphs are rendered with refined leading and a small
//     gold dropcap on the first paragraph for editorial feel.
//   • When no portrait is available, the left column becomes a typographic
//     monogram block on ink.

import Image from "next/image";
import type { TFunction } from "@/lib/i18n/t";
import type { SettingsPublic } from "@/types";
import { Container } from "@/components/shared";

interface StorySectionProps {
  t: TFunction;
  settings: SettingsPublic;
}

const PARAGRAPH_KEYS = [
  "about.story.paragraph_1",
  "about.story.paragraph_2",
  "about.story.paragraph_3",
  "about.story.paragraph_4",
];

export function StorySection({ t, settings }: StorySectionProps) {
  // Resolve paragraphs, skipping missing ones.
  const paragraphs = PARAGRAPH_KEYS.map((k) => t(k)).filter(
    (text) => text && !text.startsWith("["),
  );
  const portraitUrl = settings.owner_portrait_url ?? null;
  const ownerName = settings.owner_name || t("about.story.author") || "Naeem Ahmad";

  return (
    <section className="bg-cream">
      <Container className="grid gap-16 py-section md:grid-cols-12 md:gap-12">
        {/* Portrait — hairline-framed */}
        <div className="md:col-span-5">
          <div className="relative">
            {/* Decorative gold corner ticks */}
            <span aria-hidden="true" className="absolute -left-2 -top-2 h-4 w-4 border-l border-t border-gold" />
            <span aria-hidden="true" className="absolute -right-2 -top-2 h-4 w-4 border-r border-t border-gold" />
            <span aria-hidden="true" className="absolute -left-2 -bottom-2 h-4 w-4 border-l border-b border-gold" />
            <span aria-hidden="true" className="absolute -right-2 -bottom-2 h-4 w-4 border-r border-b border-gold" />
            {portraitUrl ? (
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-line-soft">
                <Image
                  src={portraitUrl}
                  alt={ownerName}
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="relative flex aspect-[4/5] w-full items-end overflow-hidden bg-ink p-8 text-cream">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,134,90,0.20),transparent_60%)]"
                />
                <p className="relative font-serif text-3xl tracking-tight text-cream md:text-4xl">
                  {ownerName}
                </p>
              </div>
            )}
          </div>
          <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-mute">
            — {ownerName}
          </p>
        </div>

        {/* Story */}
        <div className="md:col-span-7">
          <p className="label-eyebrow">{t("about.story.eyebrow") || "Die Geschichte"}</p>
          <h2 className="mt-3 font-serif text-section">{t("about.story.heading")}</h2>
          <div className="prose-base mt-8 drop-cap text-[17px] leading-[1.75] text-ink/90">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="mb-5">
                {p}
              </p>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
