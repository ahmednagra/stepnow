import Image from "next/image";
import { Users, Briefcase } from "lucide-react";
import type { TFunction } from "@/lib/i18n/t";
import type { VehiclePublic } from "@/types";
import { Container } from "@/components/shared";
import { cn } from "@/utils/cn";
import { pickT } from "@/lib/i18n/pick";

interface FleetPreviewProps {
  t: TFunction;
  vehicles: VehiclePublic[];
}

export function FleetPreview({ t, vehicles }: FleetPreviewProps) {
  if (vehicles.length === 0) return null;

  return (
    <section className="border-t border-line bg-cream">
      <Container className="py-section">
        <header className="mb-10 max-w-3xl">
          <p className="label-eyebrow">{pickT(t, "home.fleet.pre_heading", "Unsere Flotte")}</p>
          <h2 className="mt-3 font-serif text-section">{t("home.fleet.heading")}</h2>
        </header>
        <ul
          className={cn(
            "grid gap-6",
            vehicles.length === 1
              ? "md:max-w-2xl md:grid-cols-1"
              : vehicles.length === 2
                ? "md:grid-cols-2"
                : "md:grid-cols-3",
          )}
        >
          {vehicles.map((v) => (
            <li key={v.id} className="group flex flex-col border border-line bg-cream card-hover">
              <VehicleImage url={v.image_url} alt={v.name} />
              <div className="flex flex-1 flex-col gap-3 p-6">
                <h3 className="text-[17px] font-semibold tracking-tight text-ink">{v.name}</h3>
                {v.features.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {v.features.slice(0, 4).map((feature) => (
                      <li
                        key={feature}
                        className="border border-line-soft bg-paper px-2.5 py-1 text-[11px] tracking-tight text-mute-strong"
                      >
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto flex items-center gap-5 border-t border-line pt-4 text-[13px] text-mute">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-gold-deep" aria-hidden="true" strokeWidth={1.5} />
                    <span className="tabular-nums">{v.capacity_passengers}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4 text-gold-deep" aria-hidden="true" strokeWidth={1.5} />
                    <span className="tabular-nums">{v.capacity_luggage}</span>
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function VehicleImage({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,134,90,0.18),transparent_60%)]"
        />
        <span className="absolute bottom-5 left-5 right-5 font-serif text-2xl tracking-tight text-cream/85">
          {alt}
        </span>
      </div>
    );
  }
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-line-soft">
      <Image
        src={url}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        className="object-cover transition-transform duration-slow ease-out-premium group-hover:scale-[1.02]"
      />
    </div>
  );
}
