// apps/frontend/src/app/admin/(authed)/orders/page.tsx
// Orders list. Client island mirroring the bookings list (FilterToolbar + AdminTable + Pagination).

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import {
  AdminPageHeader,
  AdminCard,
  AdminTable,
  AdminTableRow,
  AdminTableCell,
  AdminTableEmpty,
  FilterToolbar,
  Pagination,
} from "@/components/admin";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { listAdminOrders, type OrderAdmin } from "@/services/orders";
import { ApiError } from "@/lib/api-errors";
import { useAdminToast } from "@/hooks/useAdminToast";
import { formatPriceEur } from "@/utils/decimal";
import { exportCsv, exportJson, printNode } from "@/utils/exporters";

const PAGE_SIZE = 20;

export default function OrdersPage() {
  const pushToast = useAdminToast((s) => s.push);
  const [orders, setOrders] = useState<OrderAdmin[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminOrders({ page, size: PAGE_SIZE, q: q || undefined });
      setOrders(res.items);
      setPages(res.pagination.pages);
      setTotal(res.pagination.total);
    } catch (err) {
      pushToast(
        "error",
        "Could not load orders",
        err instanceof ApiError ? err.message : "Network error",
      );
    } finally {
      setLoading(false);
    }
  }, [page, q, pushToast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Operations"
        title="Orders"
        description="Confirmed jobs from bookings, plus manually created parcel orders."
        actions={
          <Link
            href="/admin/orders/new"
            className="flex h-9 items-center gap-1.5 bg-slate-900 px-3.5 text-[12.5px] font-medium text-white hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            New order
          </Link>
        }
      />
      <div className="space-y-4 p-6">
        <FilterToolbar
          searchValue={q}
          onSearchChange={(v: string) => {
            setPage(1);
            setQ(v);
          }}
          searchPlaceholder="Search order-no, customer, email…"
          exports={{
            onCsv: () =>
              orders &&
              exportCsv(
                orders.map((o) => ({
                  order_number: o.order_number,
                  customer: o.customer_name,
                  email: o.customer_email,
                  pickup: o.pickup_address,
                  destination: o.destination_address,
                  scheduled: o.scheduled_datetime ?? "",
                  status: o.status,
                  net: o.net_amount,
                  vat: o.vat_amount,
                  gross: o.gross_amount,
                  created_at: o.created_at,
                })),
                `orders-${new Date().toISOString().slice(0, 10)}.csv`,
              ),
            onJson: () => orders && exportJson(orders, `orders-${Date.now()}.json`),
            onPrint: () => printNode(document.getElementById("orders-printable")),
          }}
        />

        <div id="orders-printable">
          <AdminCard flush title={`${total} ${total === 1 ? "order" : "orders"}`}>
            <AdminTable
              columns={["Order-No.", "Customer", "Route", "Scheduled", "Status", "Gross"]}
            >
              {loading ? (
                <AdminTableEmpty loading />
              ) : !orders || orders.length === 0 ? (
                <AdminTableEmpty message="No orders yet. Create one with “New order”, or convert a booking." />
              ) : (
                orders.map((o) => (
                  <AdminTableRow key={o.id}>
                    <AdminTableCell>
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono text-[11.5px] font-medium text-slate-900 hover:underline"
                      >
                        {o.order_number}
                      </Link>
                    </AdminTableCell>
                    <AdminTableCell>
                      <p className="text-[13px] text-slate-900">{o.customer_name}</p>
                      <p className="text-[11px] text-slate-500">{o.customer_email}</p>
                    </AdminTableCell>
                    <AdminTableCell>
                      <p className="line-clamp-1 max-w-xs text-[11.5px] text-slate-600">
                        {o.pickup_address} → {o.destination_address}
                      </p>
                    </AdminTableCell>
                    <AdminTableCell>
                      {o.scheduled_datetime ? (
                        <time
                          className="text-[11.5px] tabular-nums text-slate-700"
                          dateTime={o.scheduled_datetime}
                        >
                          {new Date(o.scheduled_datetime).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </AdminTableCell>
                    <AdminTableCell>
                      <OrderStatusBadge status={o.status} />
                    </AdminTableCell>
                    <AdminTableCell>
                      <span className="font-serif text-[14px] tabular-nums text-slate-900">
                        {formatPriceEur(o.gross_amount)}
                      </span>
                    </AdminTableCell>
                  </AdminTableRow>
                ))
              )}
            </AdminTable>
          </AdminCard>
        </div>

        {pages > 1 && (
          <Pagination page={page} totalPages={pages} totalItems={total} onPageChange={setPage} />
        )}
      </div>
    </>
  );
}
