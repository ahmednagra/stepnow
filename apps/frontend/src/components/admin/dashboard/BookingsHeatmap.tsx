// apps/frontend/src/components/admin/dashboard/BookingsHeatmap.tsx
// Pure SVG heatmap. Wrapped in memo() so unrelated parent state changes don't force a rebuild of the day-grid.

import { memo } from "react";

export interface HeatCell { day: number; hour: number; value: number; }
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = [6, 8, 10, 12, 14, 16, 18, 20];

interface Props { cells: HeatCell[]; }

function heatColor(t: number): string {
if (t < 0.16) return "#F5F2EC";
if (t < 0.34) return "#E2D5BE";
if (t < 0.52) return "#C2A675";
if (t < 0.70) return "#A8865A";
if (t < 0.86) return "#86683F";
return "#0F1115";
}

function BookingsHeatmapBase({ cells }: Props) {
const max = Math.max(1, ...cells.map((c) => c.value));
const grid = new Map<string, number>();
for (const c of cells) grid.set(`${c.day}-${c.hour}`, c.value);

return (
<div className="w-full">
<div className="flex">
<div className="w-10 shrink-0" />
<div className="grid flex-1 grid-cols-8 gap-1 pb-1">
{HOURS.map((h) => (
<span key={h} className="text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 tabular-nums">
{h}:00
</span>
))}
</div>
</div>
{DAYS.map((d, di) => (
<div key={d} className="flex items-center gap-1">
<span className="w-10 shrink-0 text-right pr-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-slate-600">{d}</span>
<div className="grid flex-1 grid-cols-8 gap-1">
{HOURS.map((h) => {
const v = grid.get(`${di}-${h}`) ?? 0;
const t = v / max;
return (
<div
key={`${d}-${h}`}
title={`${d} ${h}:00 — ${v} bookings`}
className="h-8 transition-transform hover:scale-110"
style={{ backgroundColor: heatColor(t) }}
role="img"
aria-label={`${d} ${h}:00, ${v} bookings`}
/>
);
})}
</div>
</div>
))}
<div className="mt-3 flex items-center justify-end gap-2 text-[10px] uppercase tracking-wider text-slate-500">
<span>fewer</span>
<span className="inline-flex gap-px">
{["#F5F2EC", "#E2D5BE", "#C2A675", "#A8865A", "#86683F", "#0F1115"].map((c) => (
<span key={c} className="h-2.5 w-3.5" style={{ backgroundColor: c }} aria-hidden="true" />
))}
</span>
<span>more</span>
</div>
</div>
);
}

export const BookingsHeatmap = memo(BookingsHeatmapBase);
