// apps/frontend/src/services/admin-stats/index.ts
// Admin stats client. Types and browser fetchers for the new SQL-aggregated dashboard endpoints.

import { nextjsApiClient } from "@/lib/nextjs-api";
import { ENDPOINTS } from "@/services/api/endpoints";

export interface RevenueSeriesPoint {
day: string;
bookings: number;
revenue_eur: number;
}

export interface RevenueSeriesResponse {
points: RevenueSeriesPoint[];
total_bookings: number;
total_revenue_eur: number;
}

export interface ServiceMixSlice {
service_id: string | null;
bookings: number;
}

export interface ServiceMixResponse {
slices: ServiceMixSlice[];
total_bookings: number;
}

export async function fetchRevenueSeries(fromDate: string, toDate: string): Promise<RevenueSeriesResponse> {
return nextjsApiClient.get<RevenueSeriesResponse>(ENDPOINTS.ADMIN.BOOKINGS_REVENUE_SERIES, {
params: { from_date: fromDate, to_date: toDate },
});
}

export async function fetchServiceMix(fromDate: string, toDate: string): Promise<ServiceMixResponse> {
return nextjsApiClient.get<ServiceMixResponse>(ENDPOINTS.ADMIN.BOOKINGS_SERVICE_MIX, {
params: { from_date: fromDate, to_date: toDate },
});
}
