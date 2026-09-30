// app/admin/(authed)/drivers/[id]/page.tsx
// Driver detail: editable record + paginated job history. Client island (reads id via useParams).
// The card's job count is the driver record's SQL rollup, not the length of the loaded page.

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdminPageHeader, AdminCard, AdminTable, AdminTableRow, AdminTableCell, AdminTableEmpty, Pagination } from "@/components/admin";
import { DeliveryStatusBadge } from "@/components/admin/DeliveryStatusBadge";
import { formatMoney } from "@/utils/decimal";
import { useDefaultCurrency, useDriver } from "@/hooks/queries";
import { useDriverOrders } from "@/hooks/queries/useDrivers";
import { DriverForm } from "../_form";

const PAGE_SIZE = 20;

export default function DriverDetailPage() {
  const cur = useDefaultCurrency();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [page, setPage] = useState(1);
  const { data: driver, isLoading } = useDriver(id);
  const { data: jobsPage } = useDriverOrders(id, { page, size: PAGE_SIZE });
  const jobs = jobsPage?.items ?? [];
  const pagination = jobsPage?.pagination;

  if (isLoading || !driver) {
    return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>;
  }

  return (
    <>
      <AdminPageHeader eyebrow="Drivers" title={driver.full_name} description="Driver record and job history." />
      <div className="space-y-4 p-6">
        <DriverForm mode="edit" initial={driver} />

        <AdminCard flush title={`${driver.orders_count} job${driver.orders_count === 1 ? "" : "s"}`}>
          <AdminTable columns={["Order-No.", "Route", "Delivery", "Gross"]}>
            {jobs.length > 0 ? jobs.map((o) => (
              <AdminTableRow key={o.id}>
                <AdminTableCell><Link href={`/admin/orders/${o.id}`} className="font-mono hover:underline">{o.order_number}</Link></AdminTableCell>
                <AdminTableCell>{o.pickup_address} → {o.destination_address}</AdminTableCell>
                <AdminTableCell><DeliveryStatusBadge status={o.delivery_status} /></AdminTableCell>
                <AdminTableCell>{formatMoney(o.gross_amount, cur)}</AdminTableCell>
              </AdminTableRow>
            )) : <AdminTableEmpty message="No jobs assigned yet." />}
          </AdminTable>
          {pagination && pagination.pages > 1 && (
            <Pagination page={pagination.page} totalPages={pagination.pages} totalItems={pagination.total} onPageChange={setPage} />
          )}
        </AdminCard>
      </div>
    </>
  );
}
