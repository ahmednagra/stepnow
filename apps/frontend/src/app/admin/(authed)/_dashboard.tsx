// apps/frontend/src/app/admin/(authed)/_dashboard.tsx
// Client dashboard. Loads aggregated data via React Query (browser bearer auth).

"use client";

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
import type { BookingAdmin } from "@/types";
import { useDashboard } from "@/hooks/queries/useDashboard";
import { useCurrentAdmin } from "@/hooks/queries";

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function DashboardClient() {
  const { data, isLoading } = useDashboard();
  const { data: admin } = useCurrentAdmin();

  if (isLoading) {
    return (
      <>
        <AdminPageHeader title="Dashboard" />
        <div className="p-6 text-[13px] text-slate-500">Loading…</div>
      </>
    );
  }
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
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const hour = new Date().getHours();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
        <div className="min-w-0">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#A8865A]">{today}</p>
          <h1 className="font-serif text-[26px] font-medium leading-none tracking-tight text-slate-900">
            Good {hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}, {firstName}
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
