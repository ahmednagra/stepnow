// apps/frontend/src/components/admin/dashboard/ServiceMixCard.tsx
// Service mix donut with side legend. Pure presentational.

import { AdminCard } from "../AdminCard";
import { ServiceMixDonut, type MixSlice } from "./ServiceMixDonut";

interface Props { slices: MixSlice[]; total: number; }

export function ServiceMixCard({ slices, total }: Props) {
  return (
    <AdminCard eyebrow="Service mix" title="Bookings by service" serif>
      <ServiceMixDonut slices={slices} />
      <div className="mt-4 flex flex-col gap-2">
        {slices.map((s) => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <div key={s.label} className="flex items-center justify-between text-[12.5px]">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2" style={{ backgroundColor: s.color }} aria-hidden="true" />
                <span className="text-slate-700">{s.label}</span>
              </span>
              <span className="tabular-nums text-slate-500">
                {s.value} · <span className="font-medium text-slate-900">{pct}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </AdminCard>
  );
}
