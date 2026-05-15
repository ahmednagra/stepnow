// apps/frontend/src/app/admin/(authed)/page.tsx

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
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function DashboardPage() {
  const data = await loadDashboardData();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AdminPageHeader
        title="Dashboard"
        description="Overview of current activity."
      />

      {/* Body — flex column that fills the remaining height on lg+ so the
          recent-activity card scrolls internally instead of the whole page. */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 sm:p-5 lg:gap-5 lg:p-6">
        {/* KPI grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
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

        {/* Recent activity — fills remaining vertical space, table scrolls inside. */}
        <Suspense
          fallback={<div className="h-40 animate-pulse border border-slate-200 bg-white" />}
        >
          <AdminCard
            title="Recent activity"
            description="Last 10 audit log entries"
            flush
            className="flex min-h-0 flex-1 flex-col"
            headerActions={
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <History className="h-3 w-3" aria-hidden="true" />
                Read-only
              </span>
            }
          >
            <div className="min-h-0 flex-1 overflow-y-auto">
              <AdminTable columns={["When", "Who", "Action", "Target"]} stickyHeader>
                {data.recentActivity.length === 0 ? (
                  <AdminTableEmpty message="No activity yet." />
                ) : (
                  data.recentActivity.map((entry) => (
                    <AdminTableRow key={entry.id}>
                      <AdminTableCell className="whitespace-nowrap tabular-nums">
                        {fmtTime(entry.created_at)}
                      </AdminTableCell>
                      <AdminTableCell>
                        <span className="block max-w-[200px] truncate sm:max-w-none">
                          {entry.actor_email || (
                            <span className="text-slate-400">system</span>
                          )}
                        </span>
                      </AdminTableCell>
                      <AdminTableCell>
                        <span className="font-mono text-[11.5px] text-slate-700">
                          {entry.action}
                        </span>
                      </AdminTableCell>
                      <AdminTableCell>
                        <span className="text-slate-600">
                          {entry.table_name}
                          {entry.table_name && (
                            <span className="ml-1 hidden font-mono text-[11px] text-slate-400 sm:inline">
                              · {entry.record_id.slice(0, 8)}
                            </span>
                          )}
                        </span>
                      </AdminTableCell>
                    </AdminTableRow>
                  ))
                )}
              </AdminTable>
            </div>
          </AdminCard>
        </Suspense>
      </div>
    </div>
  );
}