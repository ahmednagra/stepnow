// apps/frontend/src/services/admin-stats/admin-stats.client.ts
// Derives dashboard series from the existing bookings API. No backend changes needed.

import { nextjsApiClient } from "@/lib/nextjs-api";
import type { Paginated, BookingAdmin } from "@/types";
import type { Range } from "@/components/admin/dashboard/RangeSwitcher";
import type { RevenuePoint } from "@/components/admin/dashboard/RevenueChart";
import type { MixSlice } from "@/components/admin/dashboard/ServiceMixDonut";
import type { HeatCell } from "@/components/admin/dashboard/BookingsHeatmap";

const SERVICE_COLORS = ["#0F1115", "#A8865A", "#C2A675", "#D8D5CE"];

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

function fetchAll(r: Range): Promise<BookingAdmin[]> {
  return nextjsApiClient
    .get<Paginated<BookingAdmin>>("/admin/bookings", {
      params: { size: 100, from_date: fromDate(r) },
    })
    .then((p) => p.items);
}

export async function fetchDashboardSeries(r: Range): Promise<RevenuePoint[]> {
  const items = await fetchAll(r);
  const days = rangeDays(r);
  const buckets = new Map<string, { bookings: number; revenue: number }>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { bookings: 0, revenue: 0 });
  }
  for (const b of items) {
    const key = b.created_at.slice(0, 10);
    const bk = buckets.get(key);
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

export async function fetchServiceMix(r: Range, serviceLookup: Map<string, string>): Promise<{
  slices: MixSlice[]; total: number;
}> {
  const items = await fetchAll(r);
  const map = new Map<string, number>();
  for (const b of items) {
    const key = b.service_id ?? "other";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const slices: MixSlice[] = entries.map(([id, value], i) => ({
    label: serviceLookup.get(id) ?? "Other",
    value,
    color: SERVICE_COLORS[i] ?? "#D8D5CE",
  }));
  return { slices, total: entries.reduce((s, [, v]) => s + v, 0) };
}

export async function fetchHeatmap(r: Range): Promise<HeatCell[]> {
  const items = await fetchAll(r);
  const cells: HeatCell[] = [];
  const map = new Map<string, number>();
  for (const b of items) {
    const d = new Date(b.requested_datetime);
    const day = (d.getDay() + 6) % 7;
    const hour = [6, 8, 10, 12, 14, 16, 18, 20].reduce(
      (p, h) => Math.abs(h - d.getHours()) < Math.abs(p - d.getHours()) ? h : p,
      6,
    );
    const key = `${day}-${hour}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  for (let day = 0; day < 7; day++) {
    for (const hour of [6, 8, 10, 12, 14, 16, 18, 20]) {
      cells.push({ day, hour, value: map.get(`${day}-${hour}`) ?? 0 });
    }
  }
  return cells;
}
