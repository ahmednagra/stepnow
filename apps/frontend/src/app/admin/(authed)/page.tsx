// src/app/admin/(authed)/page.tsx
// Dashboard. Server component — fetches counts via the existing server-side
// admin endpoints (requires the access cookie which getCurrentAdmin already
// verified in the parent (authed)/layout.tsx).

import { Suspense } from "react";
import { CalendarCheck, Mail, MessageSquareQuote, Briefcase, History } from "lucide-react";
import { serverApiClient } from "@/lib/server-api";
import { getAccessTokenFromCookies } from "@/lib/auth-utils";
import { ENDPOINTS } from "@/services/api/endpoints";
import type {
  AuditLogEntry,
  BookingAdmin,
  ContactMessageAdmin,
  Paginated,
  PaginatedAuditLog,
} from "@/types";
import {
  AdminCard,
  AdminPageHeader,
  KpiTile,
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  AdminTableEmpty,
} from "@/components/admin";

export const dynamic = "force-dynamic"; // counts must be fresh per request

interface DashboardData {
  totalBookings: number;
  newBookings: number;
  totalMessages: number;
  unreadMessages: number;
  recentActivity: AuditLogEntry[];
}

async function loadDashboardData(): Promise<DashboardData> {
  // We're in the (authed) layout — the token MUST be present here because
  // the layout would have redirected otherwise. But fetch defensively.
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return {
      totalBookings: 0,
      newBookings: 0,
      totalMessages: 0,
      unreadMessages: 0,
      recentActivity: [],
    };
  }

  const [totalBookingsRes, newBookingsRes, totalMessagesRes, unreadMessagesRes, activityRes] =
    await Promise.allSettled([
      serverApiClient.get<Paginated<BookingAdmin>>(
        ENDPOINTS.ADMIN.BOOKINGS,
        { params: { size: 1 } },
        token,
      ),
      serverApiClient.get<Paginated<BookingAdmin>>(
        ENDPOINTS.ADMIN.BOOKINGS,
        { params: { size: 1, status: "new" } },
        token,
      ),
      serverApiClient.get<Paginated<ContactMessageAdmin>>(
        ENDPOINTS.ADMIN.CONTACT_MESSAGES,
        { params: { size: 1 } },
        token,
      ),
      serverApiClient.get<Paginated<ContactMessageAdmin>>(
        ENDPOINTS.ADMIN.CONTACT_MESSAGES,
        { params: { size: 1, status: "unread" } },
        token,
      ),
      serverApiClient.get<PaginatedAuditLog>(
        ENDPOINTS.ADMIN.AUDIT_LOG,
        { params: { size: 10 } },
        token,
      ),
    ]);

  function unwrapTotal<T>(r: PromiseSettledResult<{ data?: Paginated<T> }>): number {
    if (r.status === "fulfilled" && r.value.data) return r.value.data.pagination?.total ?? 0;
    return 0;
  }
  function unwrapActivity(
    r: PromiseSettledResult<{ data?: PaginatedAuditLog }>,
  ): AuditLogEntry[] {
    if (r.status === "fulfilled" && r.value.data) return r.value.data.items ?? [];
    return [];
  }

  return {
    totalBookings: unwrapTotal(totalBookingsRes),
    newBookings: unwrapTotal(newBookingsRes),
    totalMessages: unwrapTotal(totalMessagesRes),
    unreadMessages: unwrapTotal(unreadMessagesRes),
    recentActivity: unwrapActivity(activityRes),
  };
}

export default async function DashboardPage() {
  const data = await loadDashboardData();

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="At-a-glance overview of recent activity."
      />

      <div className="p-6">
        {/* KPI grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile
            label="Bookings"
            value={data.totalBookings}
            context={`${data.newBookings} awaiting action`}
            icon={<CalendarCheck className="h-4 w-4" strokeWidth={1.5} />}
          />
          <KpiTile
            label="Contact messages"
            value={data.totalMessages}
            context={`${data.unreadMessages} unread`}
            icon={<Mail className="h-4 w-4" strokeWidth={1.5} />}
          />
          <KpiTile
            label="Testimonials"
            value="—"
            context="Coming in 5b"
            icon={<MessageSquareQuote className="h-4 w-4" strokeWidth={1.5} />}
          />
          <KpiTile
            label="Services"
            value="—"
            context="Coming in 5b"
            icon={<Briefcase className="h-4 w-4" strokeWidth={1.5} />}
          />
        </div>

        {/* Recent activity */}
        <div className="mt-6">
          <Suspense
            fallback={<div className="h-40 animate-pulse border border-slate-200 bg-white" />}
          >
            <AdminCard
              title="Recent activity"
              description="Last 10 audit log entries"
              flush
              headerActions={
                <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  <History className="h-3 w-3" aria-hidden="true" />
                  Read-only
                </span>
              }
            >
              <AdminTable columns={["When", "Who", "Action", "Target"]}>
                {data.recentActivity.length === 0 ? (
                  <AdminTableEmpty message="No activity yet." />
                ) : (
                  data.recentActivity.map((entry) => (
                    <AdminTableRow key={entry.id}>
                      <AdminTableCell>
                        <time
                          dateTime={entry.created_at}
                          className="text-[12px] text-slate-500"
                          title={entry.created_at}
                        >
                          {formatRelativeTime(entry.created_at)}
                        </time>
                      </AdminTableCell>
                      <AdminTableCell>
                        <span className="text-[12px] text-slate-900">
                          {entry.actor_email ?? "system"}
                        </span>
                      </AdminTableCell>
                      <AdminTableCell>
                        <span className="inline-block bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-700">
                          {entry.action}
                        </span>
                      </AdminTableCell>
                      <AdminTableCell>
                        <span className="font-mono text-[11px] text-slate-600">
                          {entry.table_name}
                          {entry.record_id ? ` · ${truncate(entry.record_id, 12)}` : ""}
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
    </>
  );
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const seconds = Math.max(0, Math.floor((now - then) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
