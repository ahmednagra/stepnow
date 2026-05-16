// apps/frontend/src/components/admin/dashboard/PerformanceCard.tsx
// Performance card; inlines its own bookings fetch so admin-stats helper is gone.

"use client";

import { useEffect, useState, memo } from "react";
import { AdminCard } from "../AdminCard";
import { RangeSwitcher, type Range } from "./RangeSwitcher";
import { RevenueChart, type RevenuePoint } from "./RevenueChart";
import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Paginated, BookingAdmin } from "@/types";

function rangeDays(r: Range): number {
  if (r === "7d") return 7;
  if (r === "30d") return 30;
  if (r === "90d") return 90;
  return 365;
}

function fromDate(r: Range): string {
  const d = new Date();
  if (r === "ytd") d.setMonth(0, 1);
  else d.setDate(d.getDate() - rangeDays(r));
  return d.toISOString().slice(0, 10);
}

async function fetchSeries(r: Range): Promise<RevenuePoint[]> {
  const res = await nextjsApiClient.get<Paginated<BookingAdmin>>("/admin/bookings", {
    params: { size: 100, from_date: fromDate(r) },
  });
  const items = res.items;
  const days = rangeDays(r);
  const buckets = new Map<string, { bookings: number; revenue: number }>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), { bookings: 0, revenue: 0 });
  }
  for (const b of items) {
    const bk = buckets.get(b.created_at.slice(0, 10));
    if (!bk) continue;
    bk.bookings += 1;
    const price = b.quoted_price_eur ? Number(b.quoted_price_eur) : 0;
    if (!Number.isNaN(price)) bk.revenue += price;
  }
  return Array.from(buckets.entries()).map(([k, v]) => ({
    label: new Date(k).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    bookings: v.bookings,
    revenue: v.revenue,
  }));
}

interface Props { initialRange?: Range; initialData: RevenuePoint[]; }

function PerformanceCardBase({ initialRange = "30d", initialData }: Props) {
  const [range, setRange] = useState<Range>(initialRange);
  const [data, setData] = useState<RevenuePoint[]>(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (range === initialRange) return;
    let cancelled = false;
    setLoading(true);
    fetchSeries(range)
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
