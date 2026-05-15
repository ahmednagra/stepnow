// apps/frontend/src/components/admin/dashboard/PerformanceCard.tsx
// Wraps RevenueChart + RangeSwitcher. Re-renders only when range/data changes — outer dashboard is unaffected.

"use client";

import { useEffect, useState, memo } from "react";
import { AdminCard } from "../AdminCard";
import { RangeSwitcher, type Range } from "./RangeSwitcher";
import { RevenueChart, type RevenuePoint } from "./RevenueChart";
import { fetchDashboardSeries } from "@/services/admin-stats";

interface Props { initialRange?: Range; initialData: RevenuePoint[]; }

function PerformanceCardBase({ initialRange = "30d", initialData }: Props) {
  const [range, setRange] = useState<Range>(initialRange);
  const [data, setData] = useState<RevenuePoint[]>(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (range === initialRange) return;
    let cancelled = false;
    setLoading(true);
    fetchDashboardSeries(range)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range, initialRange]);

  return (
    <AdminCard
      eyebrow="Performance"
      title="Revenue & bookings"
      serif
      headerActions={<RangeSwitcher value={range} onChange={setRange} />}
    >
      <div className="mb-3 flex gap-5">
        <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
          <span className="h-2.5 w-2.5 bg-slate-900" aria-hidden="true" /> Revenue (€)
        </div>
        <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500">
          <span className="h-2.5 w-2.5 bg-[#A8865A]" aria-hidden="true" /> Bookings
        </div>
        {loading && <span className="text-[11px] text-slate-400">loading…</span>}
      </div>
      <RevenueChart data={data} />
    </AdminCard>
  );
}

export const PerformanceCard = memo(PerformanceCardBase);
