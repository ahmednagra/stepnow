// apps/frontend/src/components/features/about/StorySection.tsx
// Phase 3d polish — addresses audit M-11 and a layout bug.
//
// FIXES (May 2026):
//   1. Unresolved UI-string keys (e.g. "about.story.paragraph_1") were leaking
//      into the rendered output because the previous filter only caught
//      `[...]`-bracketed markers. Now we strip any string that "looks like a
//      key" (alphanumeric + dots, no spaces).
//   2. Portrait fallback used aspect-[4/5] on a half-width column, producing a
//      massive empty dark block. Replaced with a compact 1:1 monogram tile,
//      max 320px wide, so the page no longer demands an extra scrollbar.
//   3. Owner-name fallback prefers settings.business_name → "Naeem Ahmad" so
//      we never render "about.story.author" verbatim.

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

/** Returns true when the t() result is a real translation, not the key echoed back. */
function isResolved(value: string | null | undefined, key: string): boolean {
  if (!value) return false;
  // The t helper may return the key itself, the key wrapped in brackets, or
  // an empty string when missing. All of these should be treated as "missing".
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed === key) return false;
  if (trimmed === `[${key}]`) return false;
  if (trimmed.startsWith("[")) return false;
  // Heuristic: a "key-like" string has no spaces and contains at least one dot
  // and only alphanumerics/dots/underscores/hyphens. Real prose always has spaces.
  if (!/\s/.test(trimmed) && /^[a-z0-9._-]+$/i.test(trimmed) && trimmed.includes(".")) {
    return false;
  }
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
  // Resolve paragraphs, dropping any unresolved keys.
  const paragraphs = PARAGRAPH_KEYS.map((k) => resolve(t, k)).filter(
    (p): p is string => p !== null,
  );

  const portraitUrl = settings.owner_portrait_url ?? null;
  const ownerName =
    settings.owner_name ||
    resolve(t, "about.story.author") ||
    "Naeem Ahmad";
  const eyebrow = resolve(t, "about.story.eyebrow", "Die Geschichte");
  const heading = resolve(t, "about.story.heading", "Unsere Geschichte");

  // If the section has no content at all (no story paragraphs and no portrait),
  // hide it cleanly per design-direction §11.3 ("empty content disappears").
  if (paragraphs.length === 0 && !portraitUrl) {
    return null;
  }

  return (
    <section className="bg-cream">
      <Container className="grid items-start gap-12 py-section md:grid-cols-12 md:gap-12">
        {/* Portrait — compact, framed with gold corner ticks */}
        <div className="md:col-span-5">
          <div className="relative mx-auto w-full max-w-[320px]">
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
                  sizes="(min-width: 768px) 320px, 90vw"
                  className="object-cover"
                />
              </div>
            ) : (
              // Compact monogram tile — square, never taller than ~320px,
              // so the section doesn't dominate the viewport.
              <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-ink text-cream">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(168,134,90,0.22),transparent_60%)]"
                />
                <span className="relative font-serif text-6xl tracking-tight text-cream/90">
                  {initials(ownerName) || "SN"}
                </span>
              </div>
            )}
          </div>
          <p className="mt-5 text-center text-[11px] uppercase tracking-[0.22em] text-mute md:text-left">
            — {ownerName}
          </p>
        </div>

        {/* Story */}
        <div className="md:col-span-7">
          {eyebrow && <p className="label-eyebrow">{eyebrow}</p>}
          <h2 className="mt-3 font-serif text-section">{heading}</h2>
          {paragraphs.length > 0 ? (
            <div className="prose-base mt-8 drop-cap text-[17px] leading-[1.75] text-ink/90">
              {paragraphs.map((p, idx) => (
                <p key={idx} className="mb-5 last:mb-0">
                  {p}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-8 max-w-prose text-mute">
              {/* No real story yet — show a quiet, neutral placeholder. */}
              {resolve(
                t,
                "about.story.placeholder",
                "Unsere Geschichte wird in Kürze erzählt.",
              )}
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
