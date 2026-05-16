// apps/frontend/src/components/admin/dashboard/PerformanceCard.tsx
// Performance card. Now fetches SQL-aggregated series from /admin/bookings/revenue-series — no more 100-row client-side cap (fixes C-4).

"use client";

import { useEffect, useState, memo } from "react";
import { AdminCard } from "../AdminCard";
import { RangeSwitcher, type Range } from "./RangeSwitcher";
import { RevenueChart, type RevenuePoint } from "./RevenueChart";
import { fetchRevenueSeries } from "@/services/admin-stats";

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

function toDate(): string {
return new Date().toISOString().slice(0, 10);
}

async function fetchSeries(r: Range): Promise<RevenuePoint[]> {
const res = await fetchRevenueSeries(fromDate(r), toDate());
return res.points.map((p) => ({
label: new Date(p.day).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
bookings: p.bookings,
revenue: p.revenue_eur,
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
