// apps/frontend/src/components/features/home/FleetPreview.tsx
// Magazine-grid fleet section with per-category Unsplash fallback images.

import { Users, Briefcase } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, VehiclePublic } from "@/types";
import { Container } from "@/components/shared";
import { cn } from "@/utils/cn";
import { pickT } from "@/lib/i18n/pick";

interface FleetPreviewProps {
  t: TFunction;
  vehicles: VehiclePublic[];
  /** Default "de" preserves backwards compat. */
  locale?: Locale;
}

const VEHICLE_FALLBACK_URL_DEFAULT =
  "https://images.unsplash.com/photo-1523983388277-336a66bf9bcd?w=1400&q=80&auto=format&fit=crop";

const VEHICLE_FALLBACK_BY_CATEGORY: Record<string, string> = {
  sedan:
    "https://images.unsplash.com/photo-1755946076338-edeba858d557?w=1400&q=80&auto=format&fit=crop",
  car:
    "https://images.unsplash.com/photo-1755946076338-edeba858d557?w=1400&q=80&auto=format&fit=crop",
  limousine:
    "https://images.unsplash.com/photo-1755946076338-edeba858d557?w=1400&q=80&auto=format&fit=crop",
  saloon:
    "https://images.unsplash.com/photo-1755946076338-edeba858d557?w=1400&q=80&auto=format&fit=crop",
  suv:
    "https://images.unsplash.com/photo-1700884520248-92092bd21e63?w=1400&q=80&auto=format&fit=crop",
  "cross-over":
    "https://images.unsplash.com/photo-1700884520248-92092bd21e63?w=1400&q=80&auto=format&fit=crop",
  crossover:
    "https://images.unsplash.com/photo-1700884520248-92092bd21e63?w=1400&q=80&auto=format&fit=crop",
};

const TYPOGRAPHIC_CATEGORIES = new Set([
  "van",
  "minivan",
  "minibus",
  "bus",
  "shuttle",
  "transporter",
]);

function normalizeCategory(category: string | null | undefined): string {
  return (category ?? "").trim().toLowerCase();
}

function resolveImageStrategy(vehicle: VehiclePublic): {
  kind: "image";
  url: string;
} | {
  kind: "typographic";
} {
  if (vehicle.image_url && vehicle.image_url.trim()) {
    return { kind: "image", url: vehicle.image_url };
  }
  const cat = normalizeCategory(vehicle.category);
  if (TYPOGRAPHIC_CATEGORIES.has(cat)) return { kind: "typographic" };
  return { kind: "image", url: VEHICLE_FALLBACK_BY_CATEGORY[cat] ?? VEHICLE_FALLBACK_URL_DEFAULT };
}

function countWord(n: number, locale: Locale): string {
  if (locale === "de") {
    const wordsDe: Record<number, string> = {
      1: "Ein", 2: "Zwei", 3: "Drei", 4: "Vier", 5: "Fünf", 6: "Sechs", 7: "Sieben", 8: "Acht",
    };
    return wordsDe[n] ?? String(n);
  }
  const wordsEn: Record<number, string> = {
    1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven", 8: "Eight",
  };
  return wordsEn[n] ?? String(n);
}

function noun(n: number, locale: Locale): string {
  if (locale === "de") return n === 1 ? "Fahrzeug" : "Fahrzeuge";
  return n === 1 ? "vehicle" : "vehicles";
}

export function FleetPreview({ t, vehicles, locale = "de" }: FleetPreviewProps) {
  if (vehicles.length === 0) return null;

  const count = vehicles.length;
  const headingPart1 = pickT(
    t,
    "home.fleet.heading_count",
    `${countWord(count, locale)} ${noun(count, locale)},`,
  );
  const headingPart2 = pickT(
    t,
    "home.fleet.heading_standard",
    locale === "de" ? "ein Standard." : "one standard.",
  );
  const lead = pickT(
    t,
    "home.fleet.lead",
    locale === "de"
      ? "Eine kleine, bewusst gewählte Flotte. Jedes Fahrzeug wird einzeln betreut — keine geteilten Schlüssel, keine anonyme Übergabe zwischen Schichten."
      : "A small, deliberate fleet. Each vehicle is maintained on a single-driver basis — no shared keys, no anonymous handover between shifts.",
  );

  return (
    <section className="border-t border-line bg-cream">
      <Container className="py-section">
        <header className="mb-7 flex flex-col items-start gap-5 md:mb-9 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="max-w-2xl">
            <p className="label-eyebrow">{pickT(t, "home.fleet.pre_heading", locale === "de" ? "Die Flotte" : "The fleet")}</p>
            <h2 className="mt-2 font-serif text-[34px] leading-[1.05] tracking-tight md:text-[42px]">
              {headingPart1}
              <br />
              <span className="italic text-gold-deep">{headingPart2}</span>
            </h2>
          </div>
          <p className="max-w-sm text-[13.5px] leading-relaxed text-mute md:text-right">{lead}</p>
        </header>

        <ul
          className={cn(
            "grid gap-6",
            count === 1 ? "md:mx-auto md:max-w-2xl md:grid-cols-1" : count === 2 ? "md:grid-cols-2" : "md:grid-cols-3",
          )}
        >
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} locale={locale} />
          ))}
        </ul>
      </Container>
    </section>
  );
}

function VehicleCard({ vehicle, locale }: { vehicle: VehiclePublic; locale: Locale }) {
  const strategy = resolveImageStrategy(vehicle);
  const categoryLabel = (vehicle.category ?? "").trim();

  return (
    <li className="group flex flex-col border border-line bg-cream">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink">
        {strategy.kind === "image" ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={strategy.url}
              alt={vehicle.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-slow ease-out group-hover:scale-[1.02]"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </>
        ) : (
          <>
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,134,90,0.22),transparent_65%)]"
            />
            <p className="absolute bottom-5 left-5 right-5 font-serif text-[26px] leading-[1.1] tracking-tight text-cream/90 md:text-[28px]">
              {vehicle.name}
            </p>
          </>
        )}
        {categoryLabel && (
          <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 bg-cream/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink backdrop-blur-sm">
            <span aria-hidden="true" className="block h-1 w-1 rounded-full bg-gold" />
            {categoryLabel}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="font-serif text-[22px] font-medium leading-tight tracking-tight text-ink">
          {vehicle.name}
        </h3>
        {vehicle.features.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {vehicle.features.slice(0, 4).map((feature) => (
              <li
                key={feature}
                className="border border-line-soft bg-paper px-2.5 py-1 text-[11px] tracking-tight text-mute"
              >
                {feature}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex items-center gap-5 border-t border-line pt-4 text-[13px] text-mute">
          <span className="inline-flex items-center gap-1.5" title={locale === "de" ? "Fahrgäste" : "Passengers"}>
            <Users className="h-4 w-4 text-gold-deep" aria-hidden="true" strokeWidth={1.5} />
            <span className="tabular-nums">{vehicle.capacity_passengers}</span>
          </span>
          <span className="inline-flex items-center gap-1.5" title={locale === "de" ? "Gepäckstücke" : "Luggage"}>
            <Briefcase className="h-4 w-4 text-gold-deep" aria-hidden="true" strokeWidth={1.5} />
            <span className="tabular-nums">{vehicle.capacity_luggage}</span>
          </span>
        </div>
      </div>
    </li>
  );
}
