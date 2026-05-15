// apps/frontend/src/app/admin/(authed)/page.tsx
// Server-rendered dashboard. Loads everything in parallel; charts are isolated client islands.

import { Suspense } from "react";
import { CalendarCheck, Mail, Car, Euro, Activity } from "lucide-react";
import {
  AdminPageHeader, AdminCard, KpiTile,
  AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty,
} from "@/components/admin";
import { PerformanceCard } from "@/components/admin/dashboard/PerformanceCard";
import { ServiceMixCard } from "@/components/admin/dashboard/ServiceMixCard";
import { BookingsHeatmap } from "@/components/admin/dashboard/BookingsHeatmap";
import { UpcomingBookings } from "@/components/admin/dashboard/UpcomingBookings";
import { DashboardActions } from "./_dashboard-actions";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { getCurrentAdmin } from "@/lib/admin-session";
import { ENDPOINTS } from "@/services/api/endpoints";
import type {
  Paginated, BookingAdmin, ServiceAdmin, ContactMessageAdmin, TestimonialAdmin, VehicleAdmin,
} from "@/types";
import type { AuditLogEntry, PaginatedAuditLog } from "@/types";

export const dynamic = "force-dynamic";

const SERVICE_COLORS = ["#0F1115", "#A8865A", "#C2A675", "#D8D5CE"];

interface Loaded {
  bookings: BookingAdmin[];
  services: ServiceAdmin[];
  vehicles: VehicleAdmin[];
  testimonials: TestimonialAdmin[];
  messages: ContactMessageAdmin[];
  activity: AuditLogEntry[];
  totals: { bookings: number; newBookings: number; messages: number; unread: number };
}

async function loadAll(): Promise<Loaded | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) return null;
  const from = new Date(); from.setDate(from.getDate() - 30);
  const fromDate = from.toISOString().slice(0, 10);

  const [bk, bkNew, svc, vh, ts, msg, msgUnread, audit] = await Promise.allSettled([
    serverApiClient.get<Paginated<BookingAdmin>>(ENDPOINTS.ADMIN.BOOKINGS, { params: { size: 100, from_date: fromDate } }, token),
    serverApiClient.get<Paginated<BookingAdmin>>(ENDPOINTS.ADMIN.BOOKINGS, { params: { status: "new", size: 1 } }, token),
    serverApiClient.get<Paginated<ServiceAdmin>>(ENDPOINTS.ADMIN.SERVICES, { params: { size: 50 } }, token),
    serverApiClient.get<Paginated<VehicleAdmin>>(ENDPOINTS.ADMIN.VEHICLES, { params: { size: 50 } }, token),
    serverApiClient.get<Paginated<TestimonialAdmin>>(ENDPOINTS.ADMIN.TESTIMONIALS, { params: { size: 50 } }, token),
    serverApiClient.get<Paginated<ContactMessageAdmin>>(ENDPOINTS.ADMIN.CONTACT_MESSAGES, { params: { size: 50 } }, token),
    serverApiClient.get<Paginated<ContactMessageAdmin>>(ENDPOINTS.ADMIN.CONTACT_MESSAGES, { params: { is_handled: false, size: 1 } }, token),
    serverApiClient.get<PaginatedAuditLog>(ENDPOINTS.ADMIN.AUDIT_LOG, { params: { size: 10 } }, token),
  ]);

  const unwrap = <T,>(r: PromiseSettledResult<{ data?: { items?: T[] } }>): T[] =>
    r.status === "fulfilled" && r.value.data?.items ? r.value.data.items : [];

  const bookings = unwrap<BookingAdmin>(bk);
  const services = unwrap<ServiceAdmin>(svc);

  const totalBookings = bk.status === "fulfilled" ? bk.value.data?.pagination?.total ?? bookings.length : 0;
  const newBookings = bkNew.status === "fulfilled" ? bkNew.value.data?.pagination?.total ?? 0 : 0;
  const totalMessages = msg.status === "fulfilled" ? msg.value.data?.pagination?.total ?? 0 : 0;
  const unread = msgUnread.status === "fulfilled" ? msgUnread.value.data?.pagination?.total ?? 0 : 0;

  return {
    bookings,
    services,
    vehicles: unwrap<VehicleAdmin>(vh),
    testimonials: unwrap<TestimonialAdmin>(ts),
    messages: unwrap<ContactMessageAdmin>(msg),
    activity: unwrap<AuditLogEntry>(audit),
    totals: { bookings: totalBookings, newBookings, messages: totalMessages, unread },
  };
}

function buildDailySeries(items: BookingAdmin[], days = 30) {
  const map = new Map<string, { bookings: number; revenue: number }>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    map.set(d.toISOString().slice(0, 10), { bookings: 0, revenue: 0 });
  }
  for (const b of items) {
    const key = b.created_at.slice(0, 10);
    const bk = map.get(key); if (!bk) continue;
    bk.bookings += 1;
    const price = b.quoted_price_eur ? Number(b.quoted_price_eur) : 0;
    if (!Number.isNaN(price)) bk.revenue += price;
  }
  return Array.from(map.entries()).map(([k, v]) => ({
    label: new Date(k).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    bookings: v.bookings, revenue: v.revenue,
  }));
}

function buildMix(items: BookingAdmin[], services: ServiceAdmin[]) {
  const m = new Map<string, number>();
  for (const b of items) {
    const k = b.service_id ?? "other";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  const lookup = new Map(services.map((s) => [s.id, s.title_en || s.title_de]));
  const sorted = Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const slices = sorted.map(([id, value], i) => ({
    label: lookup.get(id) ?? "Other",
    value, color: SERVICE_COLORS[i] ?? "#D8D5CE",
  }));
  return { slices, total: sorted.reduce((s, [, v]) => s + v, 0) };
}

function buildHeat(items: BookingAdmin[]) {
  const HOURS = [6, 8, 10, 12, 14, 16, 18, 20];
  const m = new Map<string, number>();
  for (const b of items) {
    const d = new Date(b.requested_datetime);
    const day = (d.getDay() + 6) % 7;
    const hr = HOURS.reduce((p, h) => Math.abs(h - d.getHours()) < Math.abs(p - d.getHours()) ? h : p, 6);
    m.set(`${day}-${hr}`, (m.get(`${day}-${hr}`) ?? 0) + 1);
  }
  const cells = [];
  for (let day = 0; day < 7; day++) for (const hour of HOURS) cells.push({ day, hour, value: m.get(`${day}-${hour}`) ?? 0 });
  return cells;
}

function fleetUtilization(vehicles: VehicleAdmin[]): { pct: number; active: number; total: number } {
  const total = vehicles.length;
  const active = vehicles.filter((v) => v.active && !v.is_deleted).length;
  return { total, active, pct: total > 0 ? Math.round((active / total) * 100) : 0 };
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

  const series = buildDailySeries(data.bookings);
  const mix = buildMix(data.bookings, data.services);
  const heat = buildHeat(data.bookings);
  const fleet = fleetUtilization(data.vehicles);
  const totalRevenue = series.reduce((s, p) => s + p.revenue, 0);
  const upcoming = data.bookings
    .filter((b) => new Date(b.requested_datetime) >= new Date() && b.status !== "cancelled" && b.status !== "completed")
    .sort((a, b) => +new Date(a.requested_datetime) - +new Date(b.requested_datetime))
    .slice(0, 4);

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
            value={data.totals.bookings.toLocaleString()}
            context={`${data.totals.newBookings} awaiting action`}
            icon={<CalendarCheck className="h-4 w-4" strokeWidth={1.5} />}
            accent="gold"
            sparkline={series.slice(-12).map((p) => p.bookings)}
          />
          <KpiTile
            label="Revenue (30D)"
            value={`€${Math.round(totalRevenue).toLocaleString()}`}
            context={`avg €${series.length > 0 ? Math.round(totalRevenue / Math.max(1, series.filter(p => p.revenue > 0).length)).toLocaleString() : 0}`}
            icon={<Euro className="h-4 w-4" strokeWidth={1.5} />}
            accent="ink"
            sparkline={series.slice(-12).map((p) => p.revenue)}
          />
          <KpiTile
            label="Fleet utilization"
            value={<>{fleet.pct}<span className="text-[18px] text-slate-400">%</span></>}
            context={`${fleet.active} of ${fleet.total} active`}
            icon={<Car className="h-4 w-4" strokeWidth={1.5} />}
            accent="gold-deep"
          />
          <KpiTile
            label="Messages"
            value={data.totals.messages.toLocaleString()}
            context={`${data.totals.unread} unread`}
            icon={<Mail className="h-4 w-4" strokeWidth={1.5} />}
            accent="mute"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.65fr_1fr]">
          <PerformanceCard initialRange="30d" initialData={series} />
          <ServiceMixCard slices={mix.slices} total={mix.total} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <UpcomingBookings items={upcoming} />
          <AdminCard eyebrow="Weekly pattern" title="Bookings by day & hour" serif>
            <BookingsHeatmap cells={heat} />
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
