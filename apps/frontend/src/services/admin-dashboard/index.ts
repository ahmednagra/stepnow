// apps/frontend/src/services/admin-dashboard/index.ts
// Admin dashboard client. Types and browser fetchers for the new SQL-aggregated dashboard SSR endpoints.

import { nextjsApiClient } from "@/lib/nextjs-api";

export interface EntityTotals {
total: number;
active: number;
}

export interface BookingTotals {
total: number;
new_count: number;
}

export interface MessageTotals {
total: number;
unread: number;
}

export interface DashboardTotalsResponse {
services: EntityTotals;
vehicles: EntityTotals;
bookings: BookingTotals;
messages: MessageTotals;
}

export interface HeatmapCell {
day: number;
hour: number;
value: number;
}

export interface BookingsHeatmapResponse {
cells: HeatmapCell[];
}

export interface UpcomingBooking {
id: string;
reference: string;
status: string;
customer_name: string;
pickup_address: string;
pickup_city: string | null;
destination_address: string;
destination_city: string | null;
requested_datetime: string;
}

export interface UpcomingBookingsResponse {
items: UpcomingBooking[];
}

export async function fetchDashboardTotals(): Promise<DashboardTotalsResponse> {
return nextjsApiClient.get<DashboardTotalsResponse>("/admin/dashboard/totals");
}

export async function fetchBookingsHeatmap(): Promise<BookingsHeatmapResponse> {
return nextjsApiClient.get<BookingsHeatmapResponse>("/admin/bookings/heatmap");
}

export async function fetchUpcomingBookings(limit = 4): Promise<UpcomingBookingsResponse> {
return nextjsApiClient.get<UpcomingBookingsResponse>("/admin/bookings/upcoming", {
params: { limit },
});
}
