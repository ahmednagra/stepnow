// apps/frontend/src/app/admin/(authed)/page.tsx
// Phase 3d polish — admin dashboard with refined KPI tiles and recent activity.

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

export const dynamic = "force-dynamic";

interface DashboardData {
  totalBookings: number;
  newBookings: number;
  totalMessages: number;
  unreadMessages: number;
  recentActivity: AuditLogEntry[];
}

async function loadDashboardData(): Promise<DashboardData> {
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

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default async function DashboardPage() {
  const data = await loadDashboardData();

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Übersicht über aktuelle Aktivität."
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
                <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-400">
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
                      <AdminTableCell className="tabular-nums">
                        {fmtTime(entry.created_at)}
                      </AdminTableCell>
                      <AdminTableCell>
                        {entry.actor_email || (
                          <span className="text-slate-400">system</span>
                        )}
                      </AdminTableCell>
                      <AdminTableCell>
                        <span className="font-mono text-[11.5px] text-slate-700">
                          {entry.action}
                        </span>
                      </AdminTableCell>
                      <AdminTableCell>
                        <span className="text-slate-600">
                          {entry.resource_type}
                          {entry.resource_id && (
                            <span className="ml-1 font-mono text-[11px] text-slate-400">
                              · {entry.resource_id.slice(0, 8)}
                            </span>
                          )}
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
