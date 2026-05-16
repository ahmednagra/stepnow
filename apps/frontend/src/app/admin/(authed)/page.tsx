// apps/frontend/src/app/admin/(authed)/page.tsx
// Server-rendered dashboard. Now loads everything via SQL-aggregated endpoints — no more size:50/100 over-fetches for counts (fixes M-3). The five-fetch pipeline is: dashboard/totals + bookings/heatmap + bookings/upcoming + bookings/revenue-series + bookings/service-mix, plus a small services fetch for mix labels and the audit log feed.

import { Suspense } from "react";
import { CalendarCheck, Mail, Car, Euro, Activity } from "lucide-react";
import {
AdminPageHeader, AdminCard, KpiTile,
AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty,
} from "@/components/admin";
import { PerformanceCard } from "@/components/admin/dashboard/PerformanceCard";
import { ServiceMixCard } from "@/components/admin/dashboard/ServiceMixCard";
import { BookingsHeatmap, type HeatCell } from "@/components/admin/dashboard/BookingsHeatmap";
import { UpcomingBookings } from "@/components/admin/dashboard/UpcomingBookings";
import type { RevenuePoint } from "@/components/admin/dashboard/RevenueChart";
import type { MixSlice } from "@/components/admin/dashboard/ServiceMixDonut";
import { DashboardActions } from "./_dashboard-actions";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { getCurrentAdmin } from "@/lib/admin-session";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, BookingAdmin, ServiceAdmin } from "@/types";
import type { AuditLogEntry, PaginatedAuditLog } from "@/types";
import type {
DashboardTotalsResponse,
BookingsHeatmapResponse,
UpcomingBookingsResponse,
} from "@/services/admin-dashboard";
import type {
RevenueSeriesResponse,
ServiceMixResponse,
} from "@/services/admin-stats";

export const dynamic = "force-dynamic";

const SERVICE_COLORS = ["#0F1115", "#A8865A", "#C2A675", "#D8D5CE"];

interface Loaded {
totals: DashboardTotalsResponse;
series: RevenuePoint[];
mix: { slices: MixSlice[]; total: number };
heat: HeatCell[];
upcoming: UpcomingBookingsResponse["items"];
activity: AuditLogEntry[];
}

function isoDate(d: Date): string {
return d.toISOString().slice(0, 10);
}

async function loadAll(): Promise<Loaded | null> {
const token = await getAccessTokenFromCookies();
if (!token) return null;

const to = new Date();
const from = new Date(); from.setDate(from.getDate() - 30);
const fromDate = isoDate(from);
const toDate = isoDate(to);

const [totals, revenue, mix, heatmap, upcoming, services, audit] = await Promise.allSettled([
serverApiClient.get<DashboardTotalsResponse>(ENDPOINTS.ADMIN.DASHBOARD_TOTALS, {}, token),
serverApiClient.get<RevenueSeriesResponse>(ENDPOINTS.ADMIN.BOOKINGS_REVENUE_SERIES, { params: { from_date: fromDate, to_date: toDate } }, token),
serverApiClient.get<ServiceMixResponse>(ENDPOINTS.ADMIN.BOOKINGS_SERVICE_MIX, { params: { from_date: fromDate, to_date: toDate } }, token),
serverApiClient.get<BookingsHeatmapResponse>(ENDPOINTS.ADMIN.BOOKINGS_HEATMAP, {}, token),
serverApiClient.get<UpcomingBookingsResponse>(ENDPOINTS.ADMIN.BOOKINGS_UPCOMING, { params: { limit: 4 } }, token),
serverApiClient.get<Paginated<ServiceAdmin>>(ENDPOINTS.ADMIN.SERVICES, { params: { size: 20 } }, token),
serverApiClient.get<PaginatedAuditLog>(ENDPOINTS.ADMIN.AUDIT_LOG, { params: { size: 10 } }, token),
]);

if (totals.status !== "fulfilled" || !totals.value.data) return null;
const totalsData = totals.value.data;

const revenueData = revenue.status === "fulfilled" ? revenue.value.data : undefined;
const series: RevenuePoint[] = revenueData
? revenueData.points.map((p) => ({
label: new Date(p.day).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
bookings: p.bookings,
revenue: p.revenue_eur,
}))
: [];

const mixData = mix.status === "fulfilled" ? mix.value.data : undefined;
const servicesData = services.status === "fulfilled" ? services.value.data?.items ?? [] : [];
const serviceLookup = new Map(servicesData.map((s) => [s.id, s.title_en || s.title_de]));
const sortedSlices = mixData
? [...mixData.slices].sort((a, b) => b.bookings - a.bookings).slice(0, 4)
: [];
const mixSlices: MixSlice[] = sortedSlices.map((s, i) => ({
label: s.service_id ? serviceLookup.get(s.service_id) ?? "Other" : "Other",
value: s.bookings,
color: SERVICE_COLORS[i] ?? "#D8D5CE",
}));
const mixTotal = sortedSlices.reduce((sum, s) => sum + s.bookings, 0);

const heatmapData = heatmap.status === "fulfilled" ? heatmap.value.data : undefined;
const heat: HeatCell[] = heatmapData ? heatmapData.cells : [];

const upcomingData = upcoming.status === "fulfilled" ? upcoming.value.data : undefined;
const upcomingItems = upcomingData ? upcomingData.items : [];

const auditData = audit.status === "fulfilled" ? audit.value.data?.items ?? [] : [];

return {
totals: totalsData,
series,
mix: { slices: mixSlices, total: mixTotal },
heat,
upcoming: upcomingItems,
activity: auditData,
};
}

function fmtTime(iso: string): string {
try {
return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
} catch { return iso; }
}

export const metadata = {
title: "Dashboard · StepNow Admin",
robots: { index: false, follow: false },
};

export default async function DashboardPage() {
const [data, admin] = await Promise.all([loadAll(), getCurrentAdmin()]);
if (!data) {
return (
<>
<AdminPageHeader title="Dashboard" />
<div className="p-6"><AdminCard><p className="text-sm text-red-600">Could not load dashboard data.</p></AdminCard></div>
</>
);
}

const totalRevenue = data.series.reduce((s, p) => s + p.revenue, 0);
const avgRevenueDays = Math.max(1, data.series.filter((p) => p.revenue > 0).length);
const fleetTotal = data.totals.vehicles.total;
const fleetActive = data.totals.vehicles.active;
const fleetPct = fleetTotal > 0 ? Math.round((fleetActive / fleetTotal) * 100) : 0;

// Convert UpcomingBooking back to BookingAdmin shape (with nullable fields) for the existing component.
const upcomingForCard: BookingAdmin[] = data.upcoming.map((b) => ({
id: b.id,
reference: b.reference,
status: b.status as BookingAdmin["status"],
service_id: null,
pickup_address: b.pickup_address,
pickup_postcode: null,
pickup_city: b.pickup_city,
destination_address: b.destination_address,
destination_postcode: null,
destination_city: b.destination_city,
requested_datetime: b.requested_datetime,
passenger_count: 0,
luggage_count: 0,
special_requirements: null,
customer_name: b.customer_name,
customer_phone: "",
customer_email: "",
is_business: false,
company_name: null,
company_vatid: null,
language: "de",
quoted_price_eur: null,
internal_notes: null,
quoted_at: null,
completed_at: null,
is_deleted: false,
created_at: b.requested_datetime,
updated_at: b.requested_datetime,
}));

const firstName = admin?.full_name?.split(" ")[0] ?? "there";
const today = new Date().toLocaleDateString("en-GB", {
weekday: "long", day: "numeric", month: "long", year: "numeric",
});

return (
<div className="flex h-full min-h-0 flex-col">
<header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
<div className="min-w-0">
<p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A8865A]">{today}</p>
<h1 className="font-serif text-[26px] font-medium leading-none tracking-tight text-slate-900">
Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {firstName}
</h1>
<p className="mt-2 text-[13px] leading-relaxed text-slate-500">
Here is the pulse of <span className="font-medium text-slate-900">StepNow</span> bookings, revenue, and fleet utilization in real time.
</p>
</div>
<DashboardActions />
</header>

<div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
<KpiTile
label="Bookings"
value={data.totals.bookings.total.toLocaleString()}
context={`${data.totals.bookings.new_count} awaiting action`}
icon={<CalendarCheck className="h-4 w-4" strokeWidth={1.5} />}
accent="gold"
sparkline={data.series.slice(-12).map((p) => p.bookings)}
/>
<KpiTile
label="Revenue (30D)"
value={`€${Math.round(totalRevenue).toLocaleString()}`}
context={`avg €${data.series.length > 0 ? Math.round(totalRevenue / avgRevenueDays).toLocaleString() : 0}`}
icon={<Euro className="h-4 w-4" strokeWidth={1.5} />}
accent="ink"
sparkline={data.series.slice(-12).map((p) => p.revenue)}
/>
<KpiTile
label="Fleet utilization"
value={<>{fleetPct}<span className="text-[18px] text-slate-400">%</span></>}
context={`${fleetActive} of ${fleetTotal} active`}
icon={<Car className="h-4 w-4" strokeWidth={1.5} />}
accent="gold-deep"
/>
<KpiTile
label="Messages"
value={data.totals.messages.total.toLocaleString()}
context={`${data.totals.messages.unread} unread`}
icon={<Mail className="h-4 w-4" strokeWidth={1.5} />}
accent="mute"
/>
</div>

<div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.65fr_1fr]">
<PerformanceCard initialRange="30d" initialData={data.series} />
<ServiceMixCard slices={data.mix.slices} total={data.mix.total} />
</div>

<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
<UpcomingBookings items={upcomingForCard} />
<AdminCard eyebrow="Weekly pattern" title="Bookings by day & hour" serif>
<BookingsHeatmap cells={data.heat} />
</AdminCard>
</div>

<Suspense fallback={<div className="h-40 animate-pulse border border-slate-200 bg-white" />}>
<AdminCard
eyebrow="Operations"
title="Recent activity"
serif
flush
headerActions={
<span className="flex items-center gap-1 text-[10.5px] text-slate-500">
<Activity className="h-3 w-3" aria-hidden="true" /> Read-only
</span>
}
>
<AdminTable columns={["When", "Who", "Action", "Target"]} stickyHeader>
{data.activity.length === 0 ? (
<AdminTableEmpty message="No activity yet." />
) : (
data.activity.map((e) => (
<AdminTableRow key={e.id}>
<AdminTableCell className="whitespace-nowrap tabular-nums">{fmtTime(e.created_at)}</AdminTableCell>
<AdminTableCell>
<span className="block max-w-[200px] truncate sm:max-w-none">
{e.actor_email || <span className="text-slate-400">system</span>}
</span>
</AdminTableCell>
<AdminTableCell>
<span className="bg-[#F5F2EC] px-1.5 py-0.5 font-mono text-[11px] text-[#86683F]">{e.action}</span>
</AdminTableCell>
<AdminTableCell>
<span className="text-slate-600">
{e.table_name}
{e.record_id && <span className="ml-1 hidden font-mono text-[11px] text-slate-400 sm:inline">· {e.record_id.slice(0, 8)}</span>}
</span>
</AdminTableCell>
</AdminTableRow>
))
)}
</AdminTable>
</AdminCard>
</Suspense>
</div>
</div>
);
}
