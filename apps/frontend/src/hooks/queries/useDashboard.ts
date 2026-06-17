// src/hooks/queries/useDashboard.ts
"use client";
import { useQuery } from "@tanstack/react-query";
import { nextjsApiClient } from "@/lib/nextjs-api";
import { queryKeys, STALE_TIMES, GC_TIMES } from "@/lib/react-query";
import { ENDPOINTS } from "@/services/api/endpoints";
import type { Paginated, ServiceAdmin, AuditLogEntry, PaginatedAuditLog } from "@/types";
import type {
  DashboardTotalsResponse,
  BookingsHeatmapResponse,
  UpcomingBookingsResponse,
} from "@/services/admin-dashboard";
import type { RevenueSeriesResponse, ServiceMixResponse } from "@/services/admin-stats";
import type { RevenuePoint } from "@/components/admin/dashboard/RevenueChart";
import type { MixSlice } from "@/components/admin/dashboard/ServiceMixDonut";
import type { HeatCell } from "@/components/admin/dashboard/BookingsHeatmap";

const SERVICE_COLORS = ["#0F1115", "#A8865A", "#C2A675", "#D8D5CE"];

export interface DashboardData {
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

async function fetchDashboard(): Promise<DashboardData> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const fromDate = isoDate(from);
  const toDate = isoDate(to);

  const [totals, revenue, mix, heatmap, upcoming, services, audit] = await Promise.allSettled([
    nextjsApiClient.get<DashboardTotalsResponse>(ENDPOINTS.ADMIN.DASHBOARD_TOTALS),
    nextjsApiClient.get<RevenueSeriesResponse>(ENDPOINTS.ADMIN.BOOKINGS_REVENUE_SERIES, { params: { from_date: fromDate, to_date: toDate } }),
    nextjsApiClient.get<ServiceMixResponse>(ENDPOINTS.ADMIN.BOOKINGS_SERVICE_MIX, { params: { from_date: fromDate, to_date: toDate } }),
    nextjsApiClient.get<BookingsHeatmapResponse>(ENDPOINTS.ADMIN.BOOKINGS_HEATMAP),
    nextjsApiClient.get<UpcomingBookingsResponse>(ENDPOINTS.ADMIN.BOOKINGS_UPCOMING, { params: { limit: 4 } }),
    nextjsApiClient.get<Paginated<ServiceAdmin>>(ENDPOINTS.ADMIN.SERVICES, { params: { size: 20 } }),
    nextjsApiClient.get<PaginatedAuditLog>(ENDPOINTS.ADMIN.AUDIT_LOG, { params: { size: 10 } }),
  ]);

  if (totals.status !== "fulfilled") throw new Error("Failed to load dashboard totals");
  const totalsData = totals.value;

  const revenueData = revenue.status === "fulfilled" ? revenue.value : undefined;
  const series: RevenuePoint[] = revenueData
    ? revenueData.points.map((p) => ({
        label: new Date(p.day).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        bookings: p.bookings,
        revenue: p.revenue_eur,
      }))
    : [];

  const mixData = mix.status === "fulfilled" ? mix.value : undefined;
  const servicesData = services.status === "fulfilled" ? services.value.items ?? [] : [];
  const serviceLookup = new Map(servicesData.map((s) => [s.id, s.title_en || s.title_de]));
  const sortedSlices = mixData ? [...mixData.slices].sort((a, b) => b.bookings - a.bookings).slice(0, 4) : [];
  const mixSlices: MixSlice[] = sortedSlices.map((s, i) => ({
    label: s.service_id ? serviceLookup.get(s.service_id) ?? "Other" : "Other",
    value: s.bookings,
    color: SERVICE_COLORS[i] ?? "#D8D5CE",
  }));
  const mixTotal = sortedSlices.reduce((sum, s) => sum + s.bookings, 0);

  const heatmapData = heatmap.status === "fulfilled" ? heatmap.value : undefined;
  const heat: HeatCell[] = heatmapData ? heatmapData.cells : [];

  const upcomingData = upcoming.status === "fulfilled" ? upcoming.value : undefined;
  const upcomingItems = upcomingData ? upcomingData.items : [];

  const auditData = audit.status === "fulfilled" ? audit.value.items ?? [] : [];

  return {
    totals: totalsData,
    series,
    mix: { slices: mixSlices, total: mixTotal },
    heat,
    upcoming: upcomingItems,
    activity: auditData,
  };
}

/** Aggregated dashboard data (totals, revenue, mix, heatmap, upcoming, activity). */
export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: queryKeys.dashboard.all,
    queryFn: async () => {
      console.log(`🔄 useDashboard: Fetching dashboard`);
      const d = await fetchDashboard();
      console.log(`✅ useDashboard: Loaded`);
      return d;
    },
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: GC_TIMES.STANDARD,
    refetchOnWindowFocus: true,
  });
}
