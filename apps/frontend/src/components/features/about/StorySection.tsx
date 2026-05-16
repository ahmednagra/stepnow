// apps/frontend/src/components/features/about/StorySection.tsx
// Option A layout — compact story column with floated portrait. Drop-cap on
// the first paragraph; gold L-corner brackets framing the portrait. Body text
// wraps to the right of the portrait then flows full-width below.

import Image from "next/image";
import type { TFunction } from "@/lib/i18n/t";
import type { SettingsPublic } from "@/types";

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

function isResolved(value: string | null | undefined, key: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed === key) return false;
  if (trimmed === `[${key}]`) return false;
  if (trimmed.startsWith("[")) return false;
  if (!/\s/.test(trimmed) && /^[a-z0-9._-]+$/i.test(trimmed) && trimmed.includes(".")) return false;
  return true;
}

function resolve(t: TFunction, key: string, fallback?: string): string | null {
  const raw = t(key);
  if (isResolved(raw, key)) return raw;
  return fallback ?? null;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function StorySection({ t, settings }: StorySectionProps) {
  const paragraphs = PARAGRAPH_KEYS.map((k) => resolve(t, k)).filter(
    (p): p is string => p !== null,
  );

  const portraitUrl: string | null = null;
  const ownerName = settings.owner_name || resolve(t, "about.story.author") || "Naeem Ahmad";
  const eyebrow = resolve(t, "about.story.eyebrow", "Die Geschichte");
  const heading = resolve(t, "about.story.heading", "Unsere Geschichte");

  if (paragraphs.length === 0 && !portraitUrl) return null;

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
        {eyebrow}
      </p>
      <h2 className="mt-1 mb-4 font-serif text-[24px] leading-tight tracking-tight md:text-[26px]">
        {heading}
      </h2>

      <div className="story-clearfix">
        {/* Floated portrait, framed with gold L-corner brackets */}
        <div className="float-left mb-3 mr-6 hidden w-[200px] md:block">
          <div className="relative">
            <span aria-hidden="true" className="absolute -left-1.5 -top-1.5 h-3 w-3 border-l border-t border-gold" />
            <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 h-3 w-3 border-r border-t border-gold" />
            <span aria-hidden="true" className="absolute -left-1.5 -bottom-1.5 h-3 w-3 border-l border-b border-gold" />
            <span aria-hidden="true" className="absolute -right-1.5 -bottom-1.5 h-3 w-3 border-r border-b border-gold" />
            {portraitUrl ? (
              <div className="relative aspect-[4/5] w-[200px] overflow-hidden bg-line">
                <Image
                  src={portraitUrl}
                  alt={ownerName}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="relative flex aspect-[4/5] w-[200px] items-center justify-center overflow-hidden bg-ink text-cream">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(168,134,90,0.22),transparent_60%)]"
                />
                <span className="relative font-serif text-5xl tracking-tight text-cream/90">
                  {initials(ownerName) || "SN"}
                </span>
              </div>
            )}
          </div>
          <p className="mt-2 text-[10.5px] uppercase tracking-[0.22em] text-mute">
            — {ownerName}
          </p>
        </div>

        {/* Mobile-only portrait (centered, before text) */}
        <div className="mb-5 flex justify-center md:hidden">
          <div className="relative">
            <span aria-hidden="true" className="absolute -left-1.5 -top-1.5 h-3 w-3 border-l border-t border-gold" />
            <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 h-3 w-3 border-r border-t border-gold" />
            <span aria-hidden="true" className="absolute -left-1.5 -bottom-1.5 h-3 w-3 border-l border-b border-gold" />
            <span aria-hidden="true" className="absolute -right-1.5 -bottom-1.5 h-3 w-3 border-r border-b border-gold" />
            {portraitUrl ? (
              <div className="relative aspect-[4/5] w-[180px] overflow-hidden bg-line">
                <Image src={portraitUrl} alt={ownerName} fill sizes="180px" className="object-cover" />
              </div>
            ) : (
              <div className="relative flex aspect-[4/5] w-[180px] items-center justify-center overflow-hidden bg-ink text-cream">
                <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(168,134,90,0.22),transparent_60%)]" />
                <span className="relative font-serif text-4xl tracking-tight text-cream/90">
                  {initials(ownerName) || "SN"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        {paragraphs.length > 0 ? (
          <div className="drop-cap text-[15.5px] leading-[1.7] text-ink/90">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="mb-3 last:mb-0">
                {p}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-[15px] text-mute">
            {resolve(t, "about.story.placeholder", "Unsere Geschichte wird in Kürze erzählt.")}
          </p>
        )}
      </div>

      <p className="mt-5 text-[11px] uppercase tracking-[0.22em] text-mute">
        — {ownerName}
         {resolve(t, "about.story.role") && (
          <>
            <span className="mx-2 text-line">·</span>
            {resolve(t, "about.story.role", "Gründer")}
          </>
        )}
      </p>
    </div>
  );
}
