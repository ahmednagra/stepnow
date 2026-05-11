// src/components/features/home/FleetPreview.tsx
import Image from "next/image";
import { Users, Briefcase } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { VehiclePublic } from "@/types";
import { Container } from "@/components/shared";
import { cn } from "@/utils/cn";

interface FleetPreviewProps {
  t: TFunction;
  vehicles: VehiclePublic[];
}

/**
 * Renders the fleet preview. If there are no vehicles configured, the section
 * hides entirely (returns null) — never an awkward "no vehicles to show" message.
 * Per design-direction.md §11.3: empty content disappears, doesn't placeholder.
 */
export function FleetPreview({ t, vehicles }: FleetPreviewProps) {
  if (vehicles.length === 0) return null;

  return (
    <section className="bg-cream">
      <Container className="py-section">
        <header className="mb-12 max-w-3xl">
          <h2 className="font-serif text-section">{t("home.fleet.heading")}</h2>
        </header>
        <ul
          className={cn(
            "grid gap-6",
            vehicles.length === 1
              ? "md:grid-cols-1 md:max-w-2xl"
              : vehicles.length === 2
              ? "md:grid-cols-2"
              : "md:grid-cols-3",
          )}
        >
          {vehicles.map((v) => (
            <li key={v.id} className="flex flex-col border border-line bg-cream">
              <VehicleImage url={v.image_url} alt={v.name} />
              <div className="flex flex-1 flex-col gap-3 p-6">
                <h3 className="font-serif text-xl tracking-tight">{v.name}</h3>
                <div className="flex flex-wrap items-center gap-4 text-sm text-mute">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    {v.capacity_passengers}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" aria-hidden="true" />
                    {v.capacity_luggage}
                  </span>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-mute">
                  {v.features.slice(0, 4).map((feature) => (
                    <li key={feature} className="before:mr-2 before:text-gold before:content-['—']">
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function VehicleImage({ url, alt }: { url: string | null; alt: string }) {
  // Typographic empty-state when no photo yet — see design-direction.md §11.3.
  if (!url) {
    return (
      <div
        className="flex aspect-[4/3] items-center justify-center bg-ink/95"
        aria-hidden="true"
      >
        <span className="font-serif text-4xl text-cream/30">{alt.split(" ")[0]}</span>
      </div>
    );
  }
  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-line/30">
      <Image
        src={url}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover"
      />
    </div>
  );
}
