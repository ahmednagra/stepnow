import Image from "next/image";
import { Users, Briefcase } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { Locale, VehiclePublic } from "@/types";
import { Container } from "@/components/shared";
import { cn } from "@/utils/cn";
import { pickT } from "@/lib/i18n/pick";
import { resolveMediaUrl } from "@/utils/media-url";

interface FleetPreviewProps {
  t: TFunction;
  vehicles: VehiclePublic[];
  locale?: Locale;
}

const VEHICLE_FALLBACK_URL_DEFAULT = "https://images.unsplash.com/photo-1523983388277-336a66bf9bcd?w=1400&q=80&auto=format&fit=crop";

const VEHICLE_FALLBACK_BY_CATEGORY: Record<string, string> = {
  sedan: "https://images.unsplash.com/photo-1755946076338-edeba858d557?w=1400&q=80&auto=format&fit=crop",
  car: "https://images.unsplash.com/photo-1755946076338-edeba858d557?w=1400&q=80&auto=format&fit=crop",
  limousine: "https://images.unsplash.com/photo-1755946076338-edeba858d557?w=1400&q=80&auto=format&fit=crop",
  saloon: "https://images.unsplash.com/photo-1755946076338-edeba858d557?w=1400&q=80&auto=format&fit=crop",
  suv: "https://images.unsplash.com/photo-1700884520248-92092bd21e63?w=1400&q=80&auto=format&fit=crop",
  "cross-over": "https://images.unsplash.com/photo-1700884520248-92092bd21e63?w=1400&q=80&auto=format&fit=crop",
  crossover: "https://images.unsplash.com/photo-1700884520248-92092bd21e63?w=1400&q=80&auto=format&fit=crop",
};

const VEHICLE_FALLBACK_BY_NAME: Record<string, string> = {
  "mercedes-benz-e-class": "/vehicle/mercedes-benz-e-class.webp",
  "mercedes-benz-e-klasse": "/vehicle/mercedes-benz-e-class.webp",
  "mercedes-benz-v-class":
    "/vehicle/mercedes-benz-v-class.jpg",
  "mercedes-benz-v-klasse":
    "/vehicle/mercedes-benz-v-class.jpg",
  "vw-caddy-max": "/vehicle/vw-caddy-max.webp",
  "vw-caddy-maxi": "/vehicle/vw-caddy-max.webp",
};

function normalizeCategory(category: string | null | undefined): string {
  return (category ?? "").trim().toLowerCase();
}

function normalizeName(name: string | null | undefined): string {
  return (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function resolveImageStrategy(vehicle: VehiclePublic): { kind: "image"; url: string } | { kind: "typographic" } {
  if (vehicle.image_url && vehicle.image_url.trim()) {
    return { kind: "image", url: resolveMediaUrl(vehicle.image_url) };
  }
  const name = normalizeName(vehicle.name);
  if (VEHICLE_FALLBACK_BY_NAME[name]) return { kind: "image", url: VEHICLE_FALLBACK_BY_NAME[name] };
  const cat = normalizeCategory(vehicle.category);
  return { kind: "image", url: VEHICLE_FALLBACK_BY_CATEGORY[cat] ?? VEHICLE_FALLBACK_URL_DEFAULT };
}

function countWord(n: number, locale: Locale): string {
  if (locale === "de") {
    const wordsDe: Record<number, string> = { 1: "Ein", 2: "Zwei", 3: "Drei", 4: "Vier", 5: "Fünf", 6: "Sechs", 7: "Sieben", 8: "Acht" };
    return wordsDe[n] ?? String(n);
  }
  const wordsEn: Record<number, string> = { 1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five", 6: "Six", 7: "Seven", 8: "Eight" };
  return wordsEn[n] ?? String(n);
}

function noun(n: number, locale: Locale): string {
  if (locale === "de") return n === 1 ? "Fahrzeug" : "Fahrzeuge";
  return n === 1 ? "vehicle" : "vehicles";
}

export function FleetPreview({ t, vehicles, locale = "de" }: FleetPreviewProps) {
  if (vehicles.length === 0) return null;
  const count = vehicles.length;
  const headingPart1 = pickT(t, "home.fleet.heading_count", `${countWord(count, locale)} ${noun(count, locale)},`);
  const headingPart2 = pickT(t, "home.fleet.heading_standard", locale === "de" ? "ein Standard." : "one standard.");
  const lead = pickT(t, "home.fleet.lead", locale === "de" ? "Eine kleine, bewusst gewählte Flotte. Jedes Fahrzeug wird einzeln betreut — keine geteilten Schlüssel, keine anonyme Übergabe zwischen Schichten." : "A small, deliberate fleet. Each vehicle is maintained on a single-driver basis — no shared keys, no anonymous handover between shifts.");

  return (
    <section className="border-t border-[color:var(--color-border-soft)] bg-[var(--color-bg-page)]">
      <Container className="py-section">
        <header className="mb-7 flex flex-col items-start gap-5 md:mb-9 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.20em] text-[var(--color-accent-primary)]">
              {pickT(t, "home.fleet.pre_heading", locale === "de" ? "Die Flotte" : "The fleet")}
            </p>
            <h2 className="mt-2 font-serif text-[34px] leading-[1.05] tracking-tight text-[var(--color-text-primary)] md:text-[42px]">
              {headingPart1}
              <br />
              <span className="italic text-[var(--color-accent-primary)]">{headingPart2}</span>
            </h2>
          </div>
          <p className="max-w-sm text-[13.5px] leading-relaxed text-[var(--color-text-secondary)] md:text-right">
            {lead}
          </p>
        </header>
        <ul
          className={cn(
            "grid gap-6",
            count === 1 ? "md:mx-auto md:max-w-2xl md:grid-cols-1" : count === 2 ? "md:grid-cols-2" : "md:grid-cols-3",
          )}
        >
          {vehicles.map((v) => (<VehicleCard key={v.id} vehicle={v} locale={locale} />))}
        </ul>
      </Container>
    </section>
  );
}

function VehicleCard({ vehicle, locale }: { vehicle: VehiclePublic; locale: Locale }) {
  const strategy = resolveImageStrategy(vehicle);
  const categoryLabel = (vehicle.category ?? "").trim();

  return (
    <li className="group flex flex-col border border-[color:var(--color-border-soft)] bg-[var(--color-bg-surface)]">
      <div className="relative aspect-[4/3] w-full overflow-hidden border-b border-[color:var(--color-border-soft)] bg-[var(--color-text-primary)]">
        {strategy.kind === "image" ? (
          <>
            <Image
              src={strategy.url}
              alt={vehicle.name}
              fill
              sizes="(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw"
              loading="lazy"
              quality={75}
              className="object-cover transition-transform duration-slow ease-out md:group-hover:scale-[1.02]"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(47,58,31,0.06),rgba(47,58,31,0.42))]" />
          </>
        ) : (
          <>
            <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(167,201,87,0.18),transparent_65%)]" />
            <p className="absolute bottom-5 left-5 right-5 font-serif text-[26px] leading-[1.1] tracking-tight text-[var(--color-text-on-strong)] md:text-[28px]">
              {vehicle.name}
            </p>
          </>
        )}
        {categoryLabel && (
          <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 border border-[color:var(--color-border-soft)] bg-[color:rgba(255,253,248,0.92)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-primary)] backdrop-blur-sm">
            <span aria-hidden="true" className="block h-1.5 w-1.5 bg-[var(--color-accent-primary)]" />
            {categoryLabel}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-4 border-t-2 border-t-[var(--color-accent-primary)] p-6">
        <h3 className="font-serif text-[22px] font-medium leading-tight tracking-tight text-[var(--color-text-primary)]">
          {vehicle.name}
        </h3>
        {vehicle.features.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {vehicle.features.slice(0, 4).map((feature) => (
              <li
                key={feature}
                className="border border-[color:rgba(85,133,24,0.22)] bg-[var(--color-bg-accent-soft)] px-2.5 py-1 text-[11px] leading-relaxed tracking-tight text-[var(--color-text-secondary)]"
              >
                {feature}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto grid grid-cols-2 gap-px border border-[color:var(--color-border-soft)] bg-[color:var(--color-border-soft)]">
          <span
            className="flex items-center gap-2 bg-[var(--color-bg-accent-soft)] px-4 py-3"
            title={locale === "de" ? "Fahrgäste" : "Passengers"}
          >
            <Users className="h-4 w-4 text-[var(--color-accent-primary)]" aria-hidden="true" strokeWidth={1.5} />
            <span className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                {locale === "de" ? "Passagiere" : "Passengers"}
              </span>
              <span className="tabular-nums text-[15px] font-medium text-[var(--color-text-primary)]">
                {vehicle.capacity_passengers}
              </span>
            </span>
          </span>
          <span
            className="flex items-center gap-2 bg-[var(--color-bg-accent-soft)] px-4 py-3"
            title={locale === "de" ? "Gepäckstücke" : "Luggage"}
          >
            <Briefcase className="h-4 w-4 text-[var(--color-accent-primary)]" aria-hidden="true" strokeWidth={1.5} />
            <span className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
                {locale === "de" ? "Gepäck" : "Luggage"}
              </span>
              <span className="tabular-nums text-[15px] font-medium text-[var(--color-text-primary)]">
                {vehicle.capacity_luggage}
              </span>
            </span>
          </span>
        </div>
      </div>
    </li>
  );
}
