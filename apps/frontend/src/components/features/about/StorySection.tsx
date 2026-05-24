// apps/frontend/src/components/features/about/StorySection.tsx
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

  const portraitUrl =
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80";
  const ownerName = settings.owner_name || resolve(t, "about.story.author") || "Naeem Ahmad";
  const eyebrow = resolve(t, "about.story.eyebrow", "Die Geschichte");
  const heading = resolve(t, "about.story.heading", "Unsere Geschichte");

  if (paragraphs.length === 0 && !portraitUrl) return null;

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-serif text-[30px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[36px]">
        {heading}
      </h2>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
        {ownerName}
        {resolve(t, "about.story.role") && (
          <>
            <span className="mx-2 text-[color:var(--color-border-soft)]">/</span>
            {resolve(t, "about.story.role", "Gruender")}
          </>
        )}
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
        <div className="relative overflow-hidden border border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
          {portraitUrl ? (
            <div className="relative aspect-[4/5] w-full">
              <Image
                src={portraitUrl}
                alt={ownerName}
                fill
                sizes="(max-width: 768px) 100vw, 220px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-[var(--color-text-primary)]">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(167,201,87,0.18),transparent_60%)]"
              />
              <span className="relative font-serif text-5xl tracking-tight text-[var(--color-text-on-strong)]">
                {initials(ownerName) || "SN"}
              </span>
            </div>
          )}
        </div>

        {paragraphs.length > 0 ? (
          <div className="drop-cap text-[15px] leading-[1.75] text-[var(--color-text-secondary)] md:text-[15.5px]">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="mb-3 last:mb-0">
                {p}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-[15px] text-[var(--color-text-secondary)]">
            {resolve(t, "about.story.placeholder", "Unsere Geschichte wird in Kürze erzählt.")}
          </p>
        )}
      </div>
    </div>
  );
}
